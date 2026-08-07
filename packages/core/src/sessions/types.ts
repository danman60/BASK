/**
 * Shared vocabulary for the room/session state machine and the equipment driver
 * layer (IMPLEMENTATION_SPEC §5.2, DESIGN_SPEC §3.2).
 *
 * Pure types + tiny helpers. No I/O, no DB, no React — this file is imported by
 * the server engine, the driver implementations and (for labels) the UI.
 */

/**
 * Version of the `EquipmentDriver` contract. Bump on any breaking change to the
 * interface or to the event/status payloads. Every driver reports the version it
 * was written against so the server can refuse to talk to a stale bridge.
 */
export const EQUIPMENT_DRIVER_API_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Room states — the four states the Floor board renders (DESIGN_SPEC §3.2)
// ---------------------------------------------------------------------------

/** Matches the `bask.room_state` Postgres enum exactly. */
export type RoomStateName = 'ready' | 'in_session' | 'cleaning' | 'maintenance';

export const ROOM_STATES: readonly RoomStateName[] = [
  'ready',
  'in_session',
  'cleaning',
  'maintenance',
] as const;

/**
 * Board copy, verbatim from DESIGN_SPEC §3.2 ("Ready", "In session", "Cleaning",
 * "Maintenance"). The UI must not invent its own wording.
 */
export const ROOM_STATE_LABEL: Record<RoomStateName, string> = {
  ready: 'Ready',
  in_session: 'In session',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

/** Matches the `bask.session_state` Postgres enum exactly. */
export type SessionStateName =
  'pending' | 'in_session' | 'cleaning' | 'completed' | 'cancelled' | 'faulted';

/** Matches the `bask.session_started_by` Postgres enum exactly. */
export type SessionStartedByName = 'staff' | 'customer' | 'manual_equipment' | 'system';

// ---------------------------------------------------------------------------
// Driver-facing types
// ---------------------------------------------------------------------------

/**
 * Opaque, driver-specific unit address (T-Max bus address, `host:port`, or the
 * simulator's room id). Session logic never parses it.
 */
export type UnitAddress = string;

export interface UnitInfo {
  address: UnitAddress;
  /** Human label as the equipment reports it ("Bed 2"). */
  label: string;
  /** `bask.room_type.key` this unit maps to ("uv_lie_down", "spray_booth", …). */
  equipmentType: string;
  /** Longest session the unit will accept, in minutes. */
  maxMinutes: number;
  /** Whether the unit can hold a start-delay (staff walk-away time). */
  supportsDelay: boolean;
  /** Cooldown/cleaning lockout the unit enforces itself, in seconds. */
  cooldownSec: number;
  driverType: string;
  driverApiVersion: string;
}

/**
 * The five status kinds §5.2 names: `idle | delay | running(remaining) |
 * cooldown | fault`.
 */
export type UnitStatusKind = 'idle' | 'delay' | 'running' | 'cooldown' | 'fault';

export interface UnitStatus {
  unit: UnitAddress;
  kind: UnitStatusKind;
  /** Seconds left in the current `delay` / `running` / `cooldown` phase; 0 otherwise. */
  remainingSec: number;
  /** Programmed minutes for the in-flight session, when there is one. */
  minutes?: number;
  /** Driver-side handle for the in-flight session; correlates events to Sessions. */
  externalRef?: string;
  fault?: { code: string; message: string };
  /** ISO-8601 instant this status was observed by the driver. */
  observedAt: string;
}

export interface Ack {
  ok: boolean;
  unit: UnitAddress;
  /** Driver-side handle for the session this ack refers to. */
  externalRef?: string;
  /** Machine-readable failure reason when `ok === false`. */
  error?: string;
  at: string;
}

/**
 * Events pushed by the driver. §5.2 names `session_end`, `fault` and
 * `manual_start` explicitly; `session_start` (delay elapsed → lamps on) and
 * `cooldown_end` are additions the state machine needs to keep the board honest.
 */
export type UnitEvent =
  | {
      type: 'session_start';
      unit: UnitAddress;
      externalRef: string;
      minutes: number;
      at: string;
    }
  | {
      type: 'session_end';
      unit: UnitAddress;
      externalRef?: string;
      /** `completed` = ran to term, `cancelled` = stopped by staff, `fault` = aborted. */
      reason: 'completed' | 'cancelled' | 'fault';
      at: string;
    }
  | { type: 'cooldown_end'; unit: UnitAddress; at: string }
  | {
      /**
       * Staff started the bed on its physical timer. No check-in exists, so the
       * server must reconcile this into a Session rather than fabricate one with
       * invented customer data (§5.2: "unknown → shown as manual session").
       */
      type: 'manual_start';
      unit: UnitAddress;
      externalRef: string;
      minutes: number;
      at: string;
    }
  | {
      type: 'fault';
      unit: UnitAddress;
      code: string;
      message: string;
      at: string;
    };

export type UnitEventType = UnitEvent['type'];

/** Unsubscribe handle returned by `onEvent`. */
export type Unsubscribe = () => void;

// ---------------------------------------------------------------------------
// Small helpers used by both the engine and the board
// ---------------------------------------------------------------------------

export function secondsUntil(target: Date | string | null | undefined, now: Date): number {
  if (!target) return 0;
  const ms = (typeof target === 'string' ? new Date(target) : target).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.round(ms / 1000);
}

/** `mm:ss`, zero-padded — the 31px tabular countdown in DESIGN_SPEC §3.2. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
