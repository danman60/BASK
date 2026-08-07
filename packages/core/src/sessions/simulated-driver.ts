/**
 * `SimulatedDriver` — a full `EquipmentDriver` with no hardware behind it
 * (IMPLEMENTATION_SPEC §5.2: "M0 — full state machine incl. delay timers,
 * cooldown, random-ish manual events for demo realism").
 *
 * It is a *simulation of equipment*, not a simulation of the product. It holds
 * only what a real timer board would know — which units exist and what each one
 * is doing right now. It has never heard of customers, sessions rows, or the
 * salon. The server reconciles what this thing reports into real state; that
 * asymmetry is the whole point, and it is what makes `TMaxDriver` a drop-in.
 *
 * Determinism: every random decision comes from a seeded PRNG, so a given seed
 * replays the same manual-start pattern. `Math.random` would break demo resets.
 *
 * Time: `tick(nowMs)` is driven from outside. The driver never owns a timer, so
 * tests can run an hour of behaviour in a millisecond and the server can pin the
 * driver to the demo clock.
 */

import type { EquipmentDriverMeta, EquipmentDriver } from './driver';
import { DRIVER_ERROR } from './driver';
import type {
  Ack,
  UnitAddress,
  UnitEvent,
  UnitInfo,
  UnitStatus,
  UnitStatusKind,
  Unsubscribe,
} from './types';
import { EQUIPMENT_DRIVER_API_VERSION } from './types';

export interface SimulatedUnitSpec {
  address: UnitAddress;
  label: string;
  equipmentType: string;
  maxMinutes?: number;
  supportsDelay?: boolean;
  /** Lockout the unit enforces after a session, in seconds. */
  cooldownSec?: number;
  /** Session lengths a walk-up would plausibly punch in on the physical timer. */
  manualMinuteChoices?: number[];
}

export interface SimulatedDriverOptions {
  units: SimulatedUnitSpec[];
  /** PRNG seed. Same seed + same tick sequence ⇒ identical behaviour. */
  seed?: number;
  /**
   * Mean seconds between manual starts *per idle unit*. With 8 rooms and the
   * 300s default, the board sees a manual start roughly every 40 seconds —
   * frequent enough that a demo never waits for one, rare enough to look real.
   * Set `0` to disable.
   */
  manualStartMeanIntervalSec?: number;
  /** Mean seconds between spontaneous faults per unit. `0` (default) disables. */
  faultMeanIntervalSec?: number;
  /** Seconds a real bus takes to acknowledge a command. Adds demo realism. */
  ackLatencyMs?: number;
}

interface SimulatedUnit {
  spec: Required<SimulatedUnitSpec>;
  kind: UnitStatusKind;
  /** Absolute ms at which the current phase ends. */
  phaseEndsAtMs: number;
  minutes: number;
  externalRef: string | null;
  fault: { code: string; message: string } | null;
}

const DEFAULT_MANUAL_MINUTES = [8, 10, 12, 15];

/** mulberry32 — small, fast, and reproducible across engines. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SimulatedDriver implements EquipmentDriver, EquipmentDriverMeta {
  readonly driverType = 'simulated';
  readonly apiVersion = EQUIPMENT_DRIVER_API_VERSION;

  private readonly units = new Map<UnitAddress, SimulatedUnit>();
  private readonly listeners = new Set<(e: UnitEvent) => void>();
  private readonly rand: () => number;
  private readonly manualStartMeanIntervalSec: number;
  private readonly faultMeanIntervalSec: number;
  private readonly ackLatencyMs: number;
  private refCounter = 0;
  private lastTickMs: number | null = null;

  constructor(options: SimulatedDriverOptions) {
    this.rand = mulberry32(options.seed ?? 20260807);
    this.manualStartMeanIntervalSec = options.manualStartMeanIntervalSec ?? 300;
    this.faultMeanIntervalSec = options.faultMeanIntervalSec ?? 0;
    this.ackLatencyMs = options.ackLatencyMs ?? 0;

    for (const spec of options.units) this.addUnit(spec);
  }

  // -------------------------------------------------------------------------
  // EquipmentDriver
  // -------------------------------------------------------------------------

  async listUnits(): Promise<UnitInfo[]> {
    return [...this.units.values()].map((u) => ({
      address: u.spec.address,
      label: u.spec.label,
      equipmentType: u.spec.equipmentType,
      maxMinutes: u.spec.maxMinutes,
      supportsDelay: u.spec.supportsDelay,
      cooldownSec: u.spec.cooldownSec,
      driverType: this.driverType,
      driverApiVersion: this.apiVersion,
    }));
  }

  async startSession(unit: UnitAddress, minutes: number, delayMin = 0): Promise<Ack> {
    await this.simulateBusLatency();
    const now = Date.now();
    const u = this.units.get(unit);
    if (!u) return this.nack(unit, DRIVER_ERROR.UNKNOWN_UNIT, now);
    if (u.kind === 'fault') return this.nack(unit, DRIVER_ERROR.UNIT_FAULTED, now);
    if (u.kind !== 'idle') return this.nack(unit, DRIVER_ERROR.UNIT_BUSY, now);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > u.spec.maxMinutes) {
      return this.nack(unit, DRIVER_ERROR.MINUTES_OUT_OF_RANGE, now);
    }
    if (delayMin > 0 && !u.spec.supportsDelay) {
      return this.nack(unit, DRIVER_ERROR.DELAY_UNSUPPORTED, now);
    }

    const externalRef = this.nextRef();
    u.minutes = Math.round(minutes);
    u.externalRef = externalRef;

    if (delayMin > 0) {
      u.kind = 'delay';
      u.phaseEndsAtMs = now + delayMin * 60_000;
    } else {
      u.kind = 'running';
      u.phaseEndsAtMs = now + u.minutes * 60_000;
      this.emit({
        type: 'session_start',
        unit,
        externalRef,
        minutes: u.minutes,
        at: new Date(now).toISOString(),
      });
    }

    return { ok: true, unit, externalRef, at: new Date(now).toISOString() };
  }

  async cancelSession(unit: UnitAddress): Promise<Ack> {
    await this.simulateBusLatency();
    const now = Date.now();
    const u = this.units.get(unit);
    if (!u) return this.nack(unit, DRIVER_ERROR.UNKNOWN_UNIT, now);
    if (u.kind !== 'delay' && u.kind !== 'running') {
      return this.nack(unit, DRIVER_ERROR.NOTHING_TO_CANCEL, now);
    }

    const externalRef = u.externalRef ?? undefined;
    const wasRunning = u.kind === 'running';

    this.emit({
      type: 'session_end',
      unit,
      externalRef,
      reason: 'cancelled',
      at: new Date(now).toISOString(),
    });

    if (wasRunning) {
      // Lamps were on — the unit still enforces its cooldown.
      u.kind = 'cooldown';
      u.phaseEndsAtMs = now + u.spec.cooldownSec * 1000;
    } else {
      this.toIdle(u);
    }

    return { ok: true, unit, externalRef, at: new Date(now).toISOString() };
  }

  async getStatus(unit: UnitAddress): Promise<UnitStatus> {
    const now = Date.now();
    const u = this.units.get(unit);
    if (!u) {
      return { unit, kind: 'fault', remainingSec: 0, observedAt: new Date(now).toISOString() };
    }
    return this.statusOf(u, now);
  }

  onEvent(cb: (e: UnitEvent) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // -------------------------------------------------------------------------
  // Simulation control (not part of EquipmentDriver — server-side only)
  // -------------------------------------------------------------------------

  /**
   * Advance the simulation to `nowMs`, emitting whatever a real bus would have
   * reported in the interval. Idempotent for a repeated timestamp; safe to call
   * at any cadence — it works off elapsed wall time, not tick counts, so a
   * server that was busy for 5s still produces the right transitions.
   */
  tick(nowMs: number = Date.now()): void {
    const elapsedSec = this.lastTickMs === null ? 0 : Math.max(0, (nowMs - this.lastTickMs) / 1000);
    this.lastTickMs = nowMs;

    for (const u of this.units.values()) {
      // Phase expiry first — a unit that just finished is idle for the roll below.
      if (u.phaseEndsAtMs > 0 && nowMs >= u.phaseEndsAtMs) {
        this.expirePhase(u, nowMs);
      }
      if (elapsedSec > 0) this.maybeSpontaneous(u, nowMs, elapsedSec);
    }
  }

  /** Force a manual start now — the deterministic version of the random roll. */
  triggerManualStart(unit: UnitAddress, minutes?: number, nowMs = Date.now()): boolean {
    const u = this.units.get(unit);
    if (!u || u.kind !== 'idle') return false;
    this.beginManualStart(u, nowMs, minutes);
    return true;
  }

  /** Pick an idle unit at random and start it manually. Returns the address. */
  triggerAnyManualStart(nowMs = Date.now()): UnitAddress | null {
    const idle = [...this.units.values()].filter((u) => u.kind === 'idle');
    if (idle.length === 0) return null;
    const u = idle[Math.floor(this.rand() * idle.length)]!;
    this.beginManualStart(u, nowMs);
    return u.spec.address;
  }

  /**
   * Re-seat the driver on top of state the server already believes, after a
   * process restart. The DB is the authority; this makes the simulated hardware
   * agree with it again instead of reporting eight idle beds.
   */
  restoreUnit(
    unit: UnitAddress,
    restore: {
      kind: UnitStatusKind;
      phaseEndsAtMs: number;
      minutes?: number;
      externalRef?: string | null;
    },
  ): void {
    const u = this.units.get(unit);
    if (!u) return;
    u.kind = restore.kind;
    u.phaseEndsAtMs = restore.phaseEndsAtMs;
    u.minutes = restore.minutes ?? u.minutes;
    u.externalRef = restore.externalRef ?? null;
    u.fault = null;
  }

  /** Add a unit after construction (rooms appear when a salon is re-seeded). */
  addUnit(spec: SimulatedUnitSpec): void {
    this.units.set(spec.address, {
      spec: {
        address: spec.address,
        label: spec.label,
        equipmentType: spec.equipmentType,
        maxMinutes: spec.maxMinutes ?? 20,
        supportsDelay: spec.supportsDelay ?? true,
        cooldownSec: spec.cooldownSec ?? 300,
        manualMinuteChoices: spec.manualMinuteChoices ?? DEFAULT_MANUAL_MINUTES,
      },
      kind: 'idle',
      phaseEndsAtMs: 0,
      minutes: 0,
      externalRef: null,
      fault: null,
    });
  }

  removeUnit(unit: UnitAddress): void {
    this.units.delete(unit);
  }

  hasUnit(unit: UnitAddress): boolean {
    return this.units.has(unit);
  }

  clearFault(unit: UnitAddress): void {
    const u = this.units.get(unit);
    if (!u) return;
    this.toIdle(u);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private expirePhase(u: SimulatedUnit, nowMs: number): void {
    const at = new Date(nowMs).toISOString();
    switch (u.kind) {
      case 'delay': {
        u.kind = 'running';
        u.phaseEndsAtMs = nowMs + u.minutes * 60_000;
        this.emit({
          type: 'session_start',
          unit: u.spec.address,
          externalRef: u.externalRef ?? this.nextRef(),
          minutes: u.minutes,
          at,
        });
        return;
      }
      case 'running': {
        this.emit({
          type: 'session_end',
          unit: u.spec.address,
          externalRef: u.externalRef ?? undefined,
          reason: 'completed',
          at,
        });
        u.kind = 'cooldown';
        u.phaseEndsAtMs = nowMs + u.spec.cooldownSec * 1000;
        return;
      }
      case 'cooldown': {
        this.toIdle(u);
        this.emit({ type: 'cooldown_end', unit: u.spec.address, at });
        return;
      }
      default:
        u.phaseEndsAtMs = 0;
    }
  }

  /**
   * Roll for the events that make a demo board feel alive: staff walking up and
   * starting a bed on its own timer, and (optionally) a unit dropping out.
   *
   * Probability is derived from elapsed time, not per-call, so the rate is the
   * same whether the server ticks at 1Hz or 10Hz.
   */
  private maybeSpontaneous(u: SimulatedUnit, nowMs: number, elapsedSec: number): void {
    if (u.kind !== 'idle') return;

    if (this.manualStartMeanIntervalSec > 0) {
      const p = 1 - Math.exp(-elapsedSec / this.manualStartMeanIntervalSec);
      if (this.rand() < p) {
        this.beginManualStart(u, nowMs);
        return;
      }
    }

    if (this.faultMeanIntervalSec > 0) {
      const p = 1 - Math.exp(-elapsedSec / this.faultMeanIntervalSec);
      if (this.rand() < p) {
        u.kind = 'fault';
        u.phaseEndsAtMs = 0;
        u.fault = { code: 'lamp_fault', message: 'Lamp circuit reported open' };
        this.emit({
          type: 'fault',
          unit: u.spec.address,
          code: u.fault.code,
          message: u.fault.message,
          at: new Date(nowMs).toISOString(),
        });
      }
    }
  }

  private beginManualStart(u: SimulatedUnit, nowMs: number, minutes?: number): void {
    const choices = u.spec.manualMinuteChoices;
    const picked = minutes ?? choices[Math.floor(this.rand() * choices.length)]!;
    const externalRef = this.nextRef();
    u.kind = 'running';
    u.minutes = picked;
    u.externalRef = externalRef;
    u.phaseEndsAtMs = nowMs + picked * 60_000;
    this.emit({
      type: 'manual_start',
      unit: u.spec.address,
      externalRef,
      minutes: picked,
      at: new Date(nowMs).toISOString(),
    });
  }

  private statusOf(u: SimulatedUnit, nowMs: number): UnitStatus {
    const remainingSec =
      u.phaseEndsAtMs > 0 ? Math.max(0, Math.round((u.phaseEndsAtMs - nowMs) / 1000)) : 0;
    return {
      unit: u.spec.address,
      kind: u.kind,
      remainingSec,
      minutes: u.kind === 'idle' ? undefined : u.minutes,
      externalRef: u.externalRef ?? undefined,
      fault: u.fault ?? undefined,
      observedAt: new Date(nowMs).toISOString(),
    };
  }

  private toIdle(u: SimulatedUnit): void {
    u.kind = 'idle';
    u.phaseEndsAtMs = 0;
    u.minutes = 0;
    u.externalRef = null;
    u.fault = null;
  }

  private nack(unit: UnitAddress, error: string, nowMs: number): Ack {
    return { ok: false, unit, error, at: new Date(nowMs).toISOString() };
  }

  private nextRef(): string {
    this.refCounter += 1;
    return `sim-${this.refCounter.toString().padStart(6, '0')}`;
  }

  private emit(e: UnitEvent): void {
    for (const cb of this.listeners) cb(e);
  }

  private async simulateBusLatency(): Promise<void> {
    if (this.ackLatencyMs <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, this.ackLatencyMs));
  }
}
