import 'server-only';

import type { RoomStateName, UnitEvent } from '@bask/core/sessions';
import {
  ACTIVE_SESSION_STATES,
  SimulatedDriver,
  applyRoomEvent,
  type SimulatedUnitSpec,
} from '@bask/core/sessions';

import { prisma } from './prisma';
import { broadcastFloor } from './realtime';
import { HERO_SALON_SLUG, ensureTestSalon, resetTestFloor } from './seed';
import { readFloorState, type FloorState } from './state';

/**
 * The server half of step 7: it owns the driver, owns the clock, and owns every
 * write. Clients only read what it decided.
 *
 * Why a background ticker at all, when countdowns could be computed lazily on
 * read: because "server-authoritative" has to mean something when nobody is
 * looking. A session that ends at 14:32 must become `cleaning` at 14:32 whether
 * or not a browser is open, or the Session row's `endedAt` is a lie and every
 * downstream number built on it (lamp hours, capacity, the insight engine's
 * "soft Tuesday PM") is wrong. The board is a viewer, not a driver.
 *
 * Two independent mechanisms keep state honest, on purpose:
 *  1. **Driver events** — what the (simulated) hardware says happened.
 *  2. **The DB sweep** — what the timestamps say must have happened.
 * The sweep alone is sufficient. That redundancy is the point: after a server
 * restart the driver is empty and knows nothing, and the sweep still lands every
 * room in the right state from rows alone. §5.2's rule is that the bridge
 * reports and the cloud decides; this is what that costs in code.
 */

const GLOBAL_KEY = Symbol.for('bask.floor.engines');
const TICK_MS = 1000;

/** Seeded so a given run of the harness replays the same manual-start pattern. */
const DRIVER_SEED = 20260807;

interface EngineCache {
  engines: Map<FloorTargetName, FloorEngine>;
  /** Which evaluation of THIS module built the cached engines. See below. */
  build: symbol;
}

/**
 * Unique per module evaluation.
 *
 * The engine is cached on `globalThis` so two tickers never race on the same
 * rows. That is correct in production, where this module is evaluated once — and
 * a trap in development, where Turbopack re-evaluates the module on every edit
 * while `globalThis` keeps the engine built by the *previous* version of this
 * file. The symptom is brutal to diagnose: edits to the engine appear to do
 * nothing, and the surviving instance holds a `SimulatedDriver` whose units
 * drifted out of step with the database hours ago.
 *
 * Comparing this token against the cached one turns "my change did nothing" into
 * a clean swap.
 */
const BUILD = Symbol('bask.floor.engine.build');

interface SimConfig {
  manualMinuteChoices?: number[];
  cooldownSec?: number;
  maxMinutes?: number;
}

/**
 * Which salon an engine drives.
 *
 * M0's harness hard-wired the throwaway TEST-LANE-C salon because the fixtures
 * lane had not landed yet. It has. The real Floor runs against the seeded hero
 * salon, and the harness keeps its own sandbox so `demo:reset` rehearsals and
 * state-machine pokes never touch pitch data. Same engine, same state machine,
 * same driver — only the salon resolver differs, which is the whole point of
 * having written it this way.
 */
export type FloorTargetName = 'hero' | 'harness';

export interface FloorTarget {
  /** Resolve (and for the harness, create) the salon this engine drives. */
  resolve(): Promise<{ salonId: string; salonName: string }>;
  /**
   * Whether `resetFloor()` may delete Session rows. False for the hero salon:
   * its sessions are 90 days of seeded history that the insight engine reads,
   * so a reset there parks rooms and closes what is live, and deletes nothing.
   */
  readonly destructiveResetAllowed: boolean;
  /**
   * Mean seconds between simulated manual starts (staff using the bed's own
   * timer). This is a realism garnish, and how much of it you want depends
   * entirely on who is watching — see the two targets below.
   */
  readonly manualStartMeanIntervalSec: number;
}

export class FloorEngine {
  private driver: SimulatedDriver | null = null;
  private salonId: string | null = null;
  private salonName = '';
  private readonly target: FloorTarget;

  constructor(target: FloorTarget) {
    this.target = target;
  }

  private queue: UnitEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private booting: Promise<void> | null = null;
  private ticking = false;
  /** Bumped on every accepted state change; clients drop stale pushes with it. */
  private version = 0;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Idempotent. Seeds the test salon, hydrates the driver, starts the ticker. */
  async ensureStarted(): Promise<void> {
    if (this.salonId && this.driver) return;
    this.booting ??= this.boot().finally(() => {
      this.booting = null;
    });
    return this.booting;
  }

  private async boot(): Promise<void> {
    const resolved = await this.target.resolve();
    this.salonId = resolved.salonId;
    this.salonName = resolved.salonName;
    await this.hydrate();

    if (!this.timer) {
      this.timer = setInterval(() => {
        void this.tick();
      }, TICK_MS);
      // Never hold the process open for a dev harness.
      this.timer.unref?.();
    }
  }

  /**
   * Rebuild the driver's unit list from the DB and re-seat each unit on the
   * state the rows imply.
   *
   * This runs on boot and after any re-seed. It is the reason a server restart
   * mid-countdown is invisible: the DB says Bed 2 ends at 14:32, so the
   * simulated unit is put back into `running` with exactly that much left.
   */
  private async hydrate(): Promise<void> {
    const salonId = this.salonId;
    if (!salonId) return;

    const rooms = await prisma.room.findMany({
      where: { salonId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        roomTypeKey: true,
        state: true,
        cleaningMinutes: true,
        equipmentDevice: { select: { address: true, config: true } },
      },
    });

    const specs: SimulatedUnitSpec[] = rooms.map((room) => {
      const config = (room.equipmentDevice?.config ?? {}) as SimConfig;
      return {
        address: room.equipmentDevice?.address ?? room.id,
        label: room.name,
        equipmentType: room.roomTypeKey,
        maxMinutes: config.maxMinutes ?? 30,
        supportsDelay: true,
        cooldownSec: config.cooldownSec ?? room.cleaningMinutes * 60,
        manualMinuteChoices: config.manualMinuteChoices ?? [2, 3, 5],
      };
    });

    // Rebuilt from scratch rather than mutated: after a `demo:reset` the room
    // ids are different, and a driver holding stale units would report sessions
    // on beds that no longer exist. Dropping the reference drops its listeners
    // with it; anything it already queued is for rooms that may not exist, so
    // the queue is cleared too.
    this.queue = [];
    const driver = new SimulatedDriver({
      units: specs,
      seed: DRIVER_SEED,
      manualStartMeanIntervalSec: this.target.manualStartMeanIntervalSec,
    });
    driver.onEvent((e) => {
      this.queue.push(e);
    });
    this.driver = driver;

    const active = await prisma.session.findMany({
      where: { salonId, state: { in: [...ACTIVE_SESSION_STATES] } },
      select: {
        roomId: true,
        state: true,
        requestedMinutes: true,
        equipmentMinutes: true,
        delayMinutes: true,
        createdAt: true,
        endsAt: true,
        cleaningEndsAt: true,
      },
    });

    const unitByRoom = new Map(
      rooms.map((r) => [r.id, r.equipmentDevice?.address ?? r.id] as const),
    );

    for (const s of active) {
      const unit = unitByRoom.get(s.roomId);
      if (!unit) continue;
      const minutes = s.equipmentMinutes ?? s.requestedMinutes;
      if (s.state === 'pending') {
        driver.restoreUnit(unit, {
          kind: 'delay',
          phaseEndsAtMs: s.createdAt.getTime() + s.delayMinutes * 60_000,
          minutes,
        });
      } else if (s.state === 'in_session') {
        driver.restoreUnit(unit, {
          kind: 'running',
          phaseEndsAtMs: s.endsAt?.getTime() ?? Date.now(),
          minutes,
        });
      } else if (s.state === 'cleaning') {
        driver.restoreUnit(unit, {
          kind: 'cooldown',
          phaseEndsAtMs: s.cleaningEndsAt?.getTime() ?? Date.now(),
          minutes,
        });
      }
    }

    this.version += 1;
  }

  /** Stop the ticker. Called when a dev reload replaces this engine. */
  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.driver = null;
  }

  /** Re-resolve the salon and re-hydrate. Safe to call at any time. */
  async resync(): Promise<void> {
    const resolved = await this.target.resolve();
    this.salonId = resolved.salonId;
    this.salonName = resolved.salonName;
    await this.hydrate();
    await this.push();
  }

  /**
   * Park every room `ready` and re-hydrate.
   *
   * On the harness salon that means deleting its sessions outright. On the hero
   * salon it must not: those rows are the seeded history every insight is
   * computed from. There, live sessions are *closed* (marked cancelled, which is
   * what actually happened when someone hit reset mid-session) and history is
   * left alone.
   */
  async resetFloor(): Promise<void> {
    await this.ensureStarted();
    const salonId = this.salonId;
    if (!salonId) return;
    if (this.target.destructiveResetAllowed) {
      await resetTestFloor(salonId);
    } else {
      await prisma.session.updateMany({
        where: { salonId, state: { in: [...ACTIVE_SESSION_STATES] } },
        data: { state: 'cancelled', endedAt: new Date(), cleaningEndsAt: null },
      });
      await prisma.room.updateMany({
        where: { salonId },
        data: { state: 'ready', maintenanceNote: null },
      });
    }
    await this.hydrate();
    await this.push();
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async getState(): Promise<FloorState> {
    await this.ensureStarted();
    if (!this.salonId) throw new Error('[floor] engine failed to seed a salon');
    return readFloorState(this.salonId, this.salonName, this.version, {
      type: this.driver?.driverType ?? 'none',
      apiVersion: this.driver?.apiVersion ?? '-',
      unitCount: (await this.driver?.listUnits())?.length ?? 0,
    });
  }

  // -------------------------------------------------------------------------
  // Commands (called from server actions)
  // -------------------------------------------------------------------------

  /**
   * Start a session. The driver is asked FIRST: if the hardware refuses, no
   * Session row is written at all. Optimism belongs in the UI (§5.2's latency
   * rule), never in the database — an orphaned row is a lie that outlives the
   * request.
   */
  async startSession(input: {
    roomId: string;
    minutes: number;
    delayMinutes?: number;
    customerId?: string | null;
    serviceId?: string | null;
    visitId?: string | null;
    staffId?: string | null;
  }): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
    await this.ensureStarted();
    const driver = this.driver;
    const salonId = this.salonId;
    if (!driver || !salonId) return { ok: false, error: 'engine_not_ready' };

    const room = await prisma.room.findFirst({
      where: { id: input.roomId, salonId },
      select: {
        id: true,
        state: true,
        cleaningMinutes: true,
        equipmentDevice: { select: { address: true } },
      },
    });
    if (!room) return { ok: false, error: 'unknown_room' };

    const delayMinutes = input.delayMinutes ?? 0;
    const transition = applyRoomEvent(room.state, {
      type: 'start_requested',
      minutes: input.minutes,
      delayMinutes,
      startedBy: 'staff',
    });
    if (!transition.ok) return { ok: false, error: transition.reason };

    const unit = room.equipmentDevice?.address ?? room.id;
    let ack = await driver.startSession(unit, input.minutes, delayMinutes);

    if (!ack.ok) {
      /**
       * The driver refused a room the rows say is free. That is a disagreement
       * between what the equipment believes and what is true, and the rows win
       * (§5.2: the bridge reports, the cloud decides).
       *
       * It happens for real: `demo:reset` between pitch rehearsals, a DB edit,
       * or any restart that leaves the simulated units holding a session the
       * database no longer has. The harness papered over this with a "Re-seed"
       * button; the real Floor has no such button and must not need one — a
       * front-desk staffer cannot be asked to diagnose a stale driver. So
       * re-seat the driver from the rows and try once more.
       */
      const live = await this.activeSession(room.id);
      if (!live) {
        console.warn('[floor] driver refused a free room — re-hydrating', {
          unit,
          reason: ack.error,
        });
        await this.hydrate();
        const rehydrated = this.driver;
        if (!rehydrated) return { ok: false, error: 'engine_not_ready' };
        ack = await rehydrated.startSession(unit, input.minutes, delayMinutes);
      }
      if (!ack.ok) return { ok: false, error: ack.error ?? 'driver_rejected' };
    }

    const now = new Date();
    const started = delayMinutes === 0;
    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          salonId,
          roomId: room.id,
          customerId: input.customerId ?? null,
          serviceId: input.serviceId ?? null,
          visitId: input.visitId ?? null,
          startedByStaffId: input.staffId ?? null,
          startedBy: 'staff',
          state: started ? 'in_session' : 'pending',
          requestedMinutes: input.minutes,
          equipmentMinutes: input.minutes,
          delayMinutes,
          startedAt: started ? now : null,
          endsAt: started ? new Date(now.getTime() + input.minutes * 60_000) : null,
        },
        select: { id: true },
      });
      await tx.room.update({
        where: { id: room.id },
        data: { state: transition.to, maintenanceNote: null },
      });
      return created;
    });

    await this.push();
    return { ok: true, sessionId: session.id };
  }

  async cancelSession(roomId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    await this.ensureStarted();
    const driver = this.driver;
    const salonId = this.salonId;
    if (!driver || !salonId) return { ok: false, error: 'engine_not_ready' };

    const room = await prisma.room.findFirst({
      where: { id: roomId, salonId },
      select: {
        id: true,
        state: true,
        cleaningMinutes: true,
        equipmentDevice: { select: { address: true } },
      },
    });
    if (!room) return { ok: false, error: 'unknown_room' };

    const session = await this.activeSession(roomId);
    if (!session) return { ok: false, error: 'no_session_running' };

    const transition = applyRoomEvent(
      room.state,
      { type: 'cancel_requested' },
      { hasActiveSession: true, sessionIsRunning: session.state === 'in_session' },
    );
    if (!transition.ok) return { ok: false, error: transition.reason };

    const unit = room.equipmentDevice?.address ?? room.id;
    await driver.cancelSession(unit);
    // The driver's `session_end` event is already queued; draining it here would
    // double-apply. Write the authoritative rows and let the reconciler find the
    // session already resolved.
    this.queue = this.queue.filter((e) => !(e.unit === unit && e.type === 'session_end'));

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: session.id },
        data: {
          state: transition.sessionState ?? 'cancelled',
          endedAt: now,
          cleaningEndsAt:
            transition.to === 'cleaning'
              ? new Date(now.getTime() + room.cleaningMinutes * 60_000)
              : null,
        },
      });
      await tx.room.update({ where: { id: room.id }, data: { state: transition.to } });
    });

    await this.push();
    return { ok: true };
  }

  async setMaintenance(
    roomId: string,
    on: boolean,
    note?: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    await this.ensureStarted();
    const salonId = this.salonId;
    if (!salonId) return { ok: false, error: 'engine_not_ready' };

    const room = await prisma.room.findFirst({
      where: { id: roomId, salonId },
      select: { id: true, state: true },
    });
    if (!room) return { ok: false, error: 'unknown_room' };

    const transition = applyRoomEvent(
      room.state,
      on ? { type: 'maintenance_on', note } : { type: 'maintenance_off' },
    );
    if (!transition.ok) return { ok: false, error: transition.reason };

    await prisma.room.update({
      where: { id: room.id },
      data: {
        state: transition.to,
        maintenanceNote: on ? (note ?? 'Out of service (harness)') : null,
      },
    });
    await this.push();
    return { ok: true };
  }

  /**
   * Force the simulator to do what it otherwise does at random: staff walks up
   * and starts a bed on its own timer. The acceptance check for manual-start
   * reconciliation should not have to wait on a dice roll.
   */
  async triggerManualStart(): Promise<{ ok: true; unit: string } | { ok: false; error: string }> {
    await this.ensureStarted();
    if (!this.driver) return { ok: false, error: 'engine_not_ready' };
    const unit = this.driver.triggerAnyManualStart();
    if (!unit) return { ok: false, error: 'no_idle_unit' };
    await this.tick();
    return { ok: true, unit };
  }

  // -------------------------------------------------------------------------
  // The tick
  // -------------------------------------------------------------------------

  private async tick(): Promise<void> {
    if (this.ticking || !this.driver || !this.salonId) return;
    this.ticking = true;
    try {
      const now = new Date();
      this.driver.tick(now.getTime());

      const events = this.queue;
      this.queue = [];

      let changed = false;
      for (const event of events) {
        changed = (await this.reconcile(event, now)) || changed;
      }
      changed = (await this.sweep(now)) || changed;

      if (changed) await this.push();
    } catch (err) {
      console.error('[floor] tick failed', err);
    } finally {
      this.ticking = false;
    }
  }

  /** Fold one hardware report into authoritative rows. */
  private async reconcile(event: UnitEvent, now: Date): Promise<boolean> {
    const salonId = this.salonId;
    if (!salonId) return false;

    const room = await prisma.room.findFirst({
      where: { salonId, equipmentDevice: { address: event.unit } },
      select: { id: true, state: true, cleaningMinutes: true },
    });
    if (!room) return false;

    switch (event.type) {
      case 'session_start': {
        const session = await this.activeSession(room.id);
        if (!session || session.state !== 'pending') return false;
        await prisma.session.update({
          where: { id: session.id },
          data: {
            state: 'in_session',
            startedAt: now,
            equipmentMinutes: event.minutes,
            endsAt: new Date(now.getTime() + event.minutes * 60_000),
          },
        });
        return true;
      }

      case 'session_end': {
        const session = await this.activeSession(room.id);
        if (!session || session.state === 'cleaning') return false;
        const transition = applyRoomEvent(
          room.state,
          { type: 'session_ended', reason: event.reason },
          { hasActiveSession: true, sessionIsRunning: session.state === 'in_session' },
        );
        if (!transition.ok) return false;
        await prisma.$transaction(async (tx) => {
          await tx.session.update({
            where: { id: session.id },
            data: {
              state: transition.sessionState ?? 'cleaning',
              endedAt: now,
              cleaningEndsAt:
                transition.to === 'cleaning'
                  ? new Date(now.getTime() + room.cleaningMinutes * 60_000)
                  : null,
            },
          });
          await tx.room.update({ where: { id: room.id }, data: { state: transition.to } });
        });
        return true;
      }

      case 'manual_start': {
        // §5.2: the board must never lie about a room it cannot see. A bed that
        // is physically running gets a Session row that says exactly that —
        // `manual_equipment`, no customer, no invented check-in.
        const transition = applyRoomEvent(room.state, {
          type: 'manual_start_observed',
          minutes: event.minutes,
        });
        if (!transition.ok) {
          // The room is in maintenance or already owns a session. Stop the unit
          // so simulated hardware and authoritative state stay in agreement.
          await this.driver?.cancelSession(event.unit);
          return false;
        }

        const at = new Date(event.at);
        await prisma.$transaction(async (tx) => {
          // Manual starts routinely happen before cleaning's timer expires.
          // Close whatever the room was doing rather than leaving two live rows.
          await tx.session.updateMany({
            where: { roomId: room.id, state: { in: [...ACTIVE_SESSION_STATES] } },
            data: { state: 'completed', endedAt: at, cleaningEndsAt: null },
          });
          await tx.session.create({
            data: {
              salonId,
              roomId: room.id,
              customerId: null,
              startedBy: 'manual_equipment',
              state: 'in_session',
              requestedMinutes: event.minutes,
              equipmentMinutes: event.minutes,
              delayMinutes: 0,
              startedAt: at,
              endsAt: new Date(at.getTime() + event.minutes * 60_000),
              notes: 'Manual start reported by equipment — no check-in on file.',
            },
          });
          await tx.room.update({ where: { id: room.id }, data: { state: transition.to } });
        });
        return true;
      }

      case 'fault': {
        const session = await this.activeSession(room.id);
        const transition = applyRoomEvent(
          room.state,
          { type: 'fault', code: event.code, message: event.message },
          { hasActiveSession: Boolean(session) },
        );
        if (!transition.ok) return false;
        await prisma.$transaction(async (tx) => {
          if (session) {
            await tx.session.update({
              where: { id: session.id },
              data: { state: 'faulted', endedAt: now },
            });
          }
          await tx.room.update({
            where: { id: room.id },
            data: { state: transition.to, maintenanceNote: `${event.code}: ${event.message}` },
          });
        });
        return true;
      }

      case 'cooldown_end':
        // The DB sweep owns cleaning completion; it is correct even when the
        // driver is empty (fresh process). Nothing to do here.
        return false;
    }
  }

  /**
   * Timestamps → state, independent of anything the driver said.
   *
   * This is the safety net that makes the acceptance criterion "state survives
   * page reload" hold under a full server restart, not just an F5.
   */
  private async sweep(now: Date): Promise<boolean> {
    const salonId = this.salonId;
    if (!salonId) return false;
    let changed = false;

    // 1. Delay elapsed but the driver never said so.
    const pending = await prisma.session.findMany({
      where: { salonId, state: 'pending' },
      select: {
        id: true,
        roomId: true,
        requestedMinutes: true,
        equipmentMinutes: true,
        delayMinutes: true,
        createdAt: true,
      },
    });
    for (const s of pending) {
      const delayEndsAt = s.createdAt.getTime() + s.delayMinutes * 60_000;
      if (now.getTime() < delayEndsAt) continue;
      const minutes = s.equipmentMinutes ?? s.requestedMinutes;
      await prisma.session.update({
        where: { id: s.id },
        data: {
          state: 'in_session',
          startedAt: new Date(delayEndsAt),
          endsAt: new Date(delayEndsAt + minutes * 60_000),
        },
      });
      changed = true;
    }

    // 2. Session ran out.
    const expired = await prisma.session.findMany({
      where: { salonId, state: 'in_session', endsAt: { lte: now } },
      select: { id: true, roomId: true, endsAt: true, room: { select: { cleaningMinutes: true } } },
    });
    for (const s of expired) {
      const endedAt = s.endsAt ?? now;
      await prisma.$transaction(async (tx) => {
        await tx.session.update({
          where: { id: s.id },
          data: {
            state: 'cleaning',
            endedAt,
            cleaningEndsAt: new Date(endedAt.getTime() + s.room.cleaningMinutes * 60_000),
          },
        });
        await tx.room.update({ where: { id: s.roomId }, data: { state: 'cleaning' } });
      });
      changed = true;
    }

    // 3. Cleaning window closed → room is bookable again.
    const cleaned = await prisma.session.findMany({
      where: { salonId, state: 'cleaning', cleaningEndsAt: { lte: now } },
      select: { id: true, roomId: true },
    });
    for (const s of cleaned) {
      await prisma.$transaction(async (tx) => {
        await tx.session.update({ where: { id: s.id }, data: { state: 'completed' } });
        // A room parked in maintenance stays there — cleaning finishing does not
        // clear a fault a human has not looked at.
        await tx.room.updateMany({
          where: { id: s.roomId, state: 'cleaning' },
          data: { state: 'ready' },
        });
      });
      changed = true;
    }

    // 4. Rooms stranded mid-state with no live session (crash, manual DB edit).
    const stranded = await prisma.room.findMany({
      where: {
        salonId,
        state: { in: ['in_session', 'cleaning'] satisfies RoomStateName[] },
        sessions: { none: { state: { in: [...ACTIVE_SESSION_STATES] } } },
      },
      select: { id: true },
    });
    if (stranded.length > 0) {
      await prisma.room.updateMany({
        where: { id: { in: stranded.map((r) => r.id) } },
        data: { state: 'ready' },
      });
      changed = true;
    }

    return changed;
  }

  private async activeSession(roomId: string) {
    return prisma.session.findFirst({
      where: { roomId, state: { in: [...ACTIVE_SESSION_STATES] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, state: true, startedAt: true, endsAt: true },
    });
  }

  /** Bump the version and push the full projection to subscribed boards. */
  private async push(): Promise<void> {
    this.version += 1;
    if (!this.salonId) return;
    try {
      const state = await this.getState();
      await broadcastFloor(this.salonId, state);
    } catch (err) {
      console.warn('[floor] push failed', err);
    }
  }
}

/** The seeded pitch salon. Never seeded from here — `demo:reset` owns its rows. */
const HERO_TARGET: FloorTarget = {
  destructiveResetAllowed: false,
  /**
   * An hour, not five minutes.
   *
   * Manual starts are the honest bit of realism that proves the board reports
   * what it can see rather than what it wishes (§5.2). But this is the salon
   * somebody demos and somebody eventually runs a front desk on, and several
   * services here map to exactly one room — Level 2 UV is only ever Bed 2. At a
   * five-minute cadence the simulator takes that bed out from under the person
   * trying to check a customer into it, and the product looks broken while
   * behaving correctly. Rare enough to see over a long session, not often
   * enough to fight the operator.
   */
  manualStartMeanIntervalSec: 3600,
  async resolve() {
    const salon = await prisma.salon.findUnique({
      where: { slug: HERO_SALON_SLUG },
      select: { id: true, name: true },
    });
    if (!salon) {
      throw new Error(
        `[floor] no salon with slug "${HERO_SALON_SLUG}". Run \`pnpm demo:reset\` first.`,
      );
    }
    return { salonId: salon.id, salonName: salon.name };
  },
};

/** The M0 sandbox. Self-seeding, disposable, safe to wipe. */
const HARNESS_TARGET: FloorTarget = {
  destructiveResetAllowed: true,
  /** Frequent on purpose: the harness exists to exercise reconciliation. */
  manualStartMeanIntervalSec: 300,
  async resolve() {
    const seeded = await ensureTestSalon();
    return { salonId: seeded.salonId, salonName: seeded.salonName };
  },
};

const TARGETS: Record<FloorTargetName, FloorTarget> = {
  hero: HERO_TARGET,
  harness: HARNESS_TARGET,
};

/**
 * Cached on `globalThis`: Turbopack re-evaluates server modules on edit, and a
 * second engine would mean two tickers racing on the same rows. One engine per
 * target, because two engines on the *same* salon is the same bug.
 */
export function getFloorEngine(target: FloorTargetName = 'hero'): FloorEngine {
  const store = globalThis as unknown as Record<symbol, EngineCache | undefined>;
  let cache = store[GLOBAL_KEY];

  if (cache && cache.build !== BUILD) {
    // This module was re-evaluated (a dev edit). Stop the old engines' tickers
    // before dropping them, or every edit leaves another interval behind
    // sweeping the same rows.
    for (const stale of cache.engines.values()) stale.dispose();
    cache = undefined;
  }

  if (!cache) {
    cache = { engines: new Map(), build: BUILD };
    store[GLOBAL_KEY] = cache;
  }

  let engine = cache.engines.get(target);
  if (!engine) {
    engine = new FloorEngine(TARGETS[target]);
    cache.engines.set(target, engine);
  }
  return engine;
}
