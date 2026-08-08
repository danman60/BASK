/**
 * Room / session state machine — pure, server-authoritative.
 *
 * `ready → in_session (countdown) → cleaning → ready`, with `maintenance` as a
 * fourth state a room can be parked in (DESIGN_SPEC §3.2 names all four).
 *
 * Two rules this file exists to enforce:
 *
 * 1. **The server decides.** Clients render `deriveRoomView()` output; they never
 *    compute a transition. Every state change goes through `applyRoomEvent()` on
 *    the server and lands in Postgres before any client hears about it.
 * 2. **Time is absolute, never a tick count.** A session carries `endsAt` /
 *    `cleaningEndsAt` timestamps, so the countdown is derived from the wall clock
 *    on every read. Reloading the page, restarting the server, or a client that
 *    slept for a minute all recover the exact same state — nothing is held in a
 *    browser timer.
 *
 * No imports beyond `./types`. This module is unit-testable without a DB.
 */

import type { RoomStateName, SessionStartedByName, SessionStateName, UnitAddress } from './types';
import { ROOM_STATE_LABEL, secondsUntil } from './types';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type RoomEvent =
  /** Staff pressed "Start session". Room commits before the driver acks. */
  | {
      type: 'start_requested';
      minutes: number;
      delayMinutes: number;
      startedBy: SessionStartedByName;
      customerName?: string;
    }
  /** Delay elapsed / lamps confirmed on. */
  | { type: 'session_started' }
  /** Equipment reported the session finished (term, cancel, or abort). */
  | { type: 'session_ended'; reason: 'completed' | 'cancelled' | 'fault' }
  /** Cleaning window expired. */
  | { type: 'cleaning_finished' }
  /** Staff cancelled before/while running. */
  | { type: 'cancel_requested' }
  /** Bed started on its own physical timer — no check-in exists. */
  | { type: 'manual_start_observed'; minutes: number }
  | { type: 'fault'; code: string; message: string }
  | { type: 'maintenance_on'; note?: string }
  | { type: 'maintenance_off' };

export type RoomEventType = RoomEvent['type'];

export interface TransitionOk {
  ok: true;
  from: RoomStateName;
  to: RoomStateName;
  /** Session state this event implies, when it touches a session. */
  sessionState?: SessionStateName;
}

export interface TransitionRejected {
  ok: false;
  from: RoomStateName;
  /** Machine-readable reason; UI maps it to copy, never string-matches prose. */
  reason: TransitionRejectionCode;
}

export type Transition = TransitionOk | TransitionRejected;

export const TRANSITION_REJECTED = {
  ROOM_NOT_READY: 'room_not_ready',
  ROOM_IN_MAINTENANCE: 'room_in_maintenance',
  NO_SESSION_RUNNING: 'no_session_running',
  NOT_CLEANING: 'not_cleaning',
  CANNOT_SERVICE_OCCUPIED_ROOM: 'cannot_service_occupied_room',
  NOT_IN_MAINTENANCE: 'not_in_maintenance',
  MINUTES_OUT_OF_RANGE: 'minutes_out_of_range',
} as const;

export type TransitionRejectionCode =
  (typeof TRANSITION_REJECTED)[keyof typeof TRANSITION_REJECTED];

/** Widest session length the machine will accept, independent of unit limits. */
export const MAX_SESSION_MINUTES = 30;
export const MIN_SESSION_MINUTES = 1;

// ---------------------------------------------------------------------------
// Transition function
// ---------------------------------------------------------------------------

function reject(from: RoomStateName, reason: TransitionRejectionCode): TransitionRejected {
  return { ok: false, from, reason };
}

function accept(
  from: RoomStateName,
  to: RoomStateName,
  sessionState?: SessionStateName,
): TransitionOk {
  return { ok: true, from, to, sessionState };
}

/**
 * The single authority on "may this room move, and where to".
 *
 * Deliberate choices:
 * - A cancel during the *delay* phase returns the room to `ready` (nobody got in
 *   the bed). A cancel *while running* still goes to `cleaning` — the bed was
 *   used and must be wiped down.
 * - `manual_start_observed` is accepted from `ready` **and** from `cleaning`.
 *   Staff routinely start the next client before cleaning's timer has expired;
 *   refusing it would make the board lie about a bed that is visibly running.
 * - A room in `maintenance` accepts nothing but `maintenance_off` and `fault`.
 */
export function applyRoomEvent(
  state: RoomStateName,
  event: RoomEvent,
  options: { hasActiveSession?: boolean; sessionIsRunning?: boolean } = {},
): Transition {
  const { hasActiveSession = false, sessionIsRunning = false } = options;

  switch (event.type) {
    case 'start_requested': {
      if (state === 'maintenance') return reject(state, TRANSITION_REJECTED.ROOM_IN_MAINTENANCE);
      if (state !== 'ready') return reject(state, TRANSITION_REJECTED.ROOM_NOT_READY);
      if (
        !Number.isFinite(event.minutes) ||
        event.minutes < MIN_SESSION_MINUTES ||
        event.minutes > MAX_SESSION_MINUTES
      ) {
        return reject(state, TRANSITION_REJECTED.MINUTES_OUT_OF_RANGE);
      }
      // A delayed start still occupies the room immediately: nobody else may be
      // sent to it. The Session sits in `pending` until the delay elapses.
      return accept(state, 'in_session', event.delayMinutes > 0 ? 'pending' : 'in_session');
    }

    case 'session_started': {
      if (state !== 'in_session') return reject(state, TRANSITION_REJECTED.NO_SESSION_RUNNING);
      return accept(state, 'in_session', 'in_session');
    }

    case 'session_ended': {
      if (state !== 'in_session') return reject(state, TRANSITION_REJECTED.NO_SESSION_RUNNING);
      const sessionState: SessionStateName = event.reason === 'fault' ? 'faulted' : 'cleaning';
      return accept(state, event.reason === 'fault' ? 'maintenance' : 'cleaning', sessionState);
    }

    case 'cancel_requested': {
      if (state !== 'in_session' || !hasActiveSession) {
        return reject(state, TRANSITION_REJECTED.NO_SESSION_RUNNING);
      }
      // Ran at all → the bed needs wiping; cancelled during delay → straight back.
      return sessionIsRunning
        ? accept(state, 'cleaning', 'cleaning')
        : accept(state, 'ready', 'cancelled');
    }

    case 'cleaning_finished': {
      if (state !== 'cleaning') return reject(state, TRANSITION_REJECTED.NOT_CLEANING);
      return accept(state, 'ready', 'completed');
    }

    case 'manual_start_observed': {
      if (state === 'maintenance') return reject(state, TRANSITION_REJECTED.ROOM_IN_MAINTENANCE);
      if (state === 'in_session') return reject(state, TRANSITION_REJECTED.ROOM_NOT_READY);
      return accept(state, 'in_session', 'in_session');
    }

    case 'fault': {
      return accept(state, 'maintenance', hasActiveSession ? 'faulted' : undefined);
    }

    case 'maintenance_on': {
      if (state === 'maintenance') return reject(state, TRANSITION_REJECTED.NOT_IN_MAINTENANCE);
      if (state === 'in_session') {
        return reject(state, TRANSITION_REJECTED.CANNOT_SERVICE_OCCUPIED_ROOM);
      }
      return accept(state, 'maintenance');
    }

    case 'maintenance_off': {
      if (state !== 'maintenance') return reject(state, TRANSITION_REJECTED.NOT_IN_MAINTENANCE);
      return accept(state, 'ready');
    }
  }
}

/** Rooms staff may send a customer to right now. */
export function canStartSession(state: RoomStateName): boolean {
  return state === 'ready';
}

/** Session states that still own their room. */
export const ACTIVE_SESSION_STATES: readonly SessionStateName[] = [
  'pending',
  'in_session',
  'cleaning',
] as const;

export function isActiveSessionState(state: SessionStateName): boolean {
  return ACTIVE_SESSION_STATES.includes(state);
}

// ---------------------------------------------------------------------------
// Derived view — what the board renders
// ---------------------------------------------------------------------------

/** Minimal room shape the machine needs; a superset of `bask.room`. */
export interface RoomSnapshot {
  id: string;
  name: string;
  /** `bask.room_type.key`. */
  roomTypeKey: string;
  /** Uppercase equipment type shown above the room name (DESIGN_SPEC §3.2). */
  equipmentLabel: string;
  state: RoomStateName;
  maintenanceNote: string | null;
  cleaningMinutes: number;
  sortOrder: number;
  unit: UnitAddress | null;
  /** Real machine make, off `equipment_device.config` — e.g. `Ergoline`. */
  manufacturer: string | null;
  /** Repo-local equipment photo, `/equipment/<room-key>.jpg`. */
  image: string | null;
}

/** Minimal session shape the machine needs; a superset of `bask.session`. */
export interface SessionSnapshot {
  id: string;
  roomId: string;
  state: SessionStateName;
  startedBy: SessionStartedByName;
  requestedMinutes: number;
  /** What the equipment actually accepted, once it has told us. May be clamped. */
  equipmentMinutes: number | null;
  delayMinutes: number;
  customerName: string | null;
  createdAt: string;
  startedAt: string | null;
  endsAt: string | null;
  cleaningEndsAt: string | null;
}

/** What a room card needs and nothing more. */
export interface RoomView {
  roomId: string;
  name: string;
  roomTypeKey: string;
  equipmentLabel: string;
  /** Real machine make, off `equipment_device.config` — e.g. `Ergoline`. */
  manufacturer: string | null;
  /** Repo-local equipment photo, `/equipment/<room-key>.jpg`. */
  image: string | null;
  state: RoomStateName;
  /** "Ready" / "In session" / "Cleaning" / "Maintenance". */
  stateLabel: string;
  /** `delay` while a start is pending, `running` once lamps are on. */
  phase: 'idle' | 'delay' | 'running' | 'cleaning' | 'maintenance';
  /** Seconds remaining in the current phase, derived from absolute timestamps. */
  remainingSec: number;
  /** Total seconds this phase was scheduled for — drives progress rings. */
  totalSec: number;
  customerName: string | null;
  /** True when the session came off the bed's own timer, not a check-in. */
  isManual: boolean;
  maintenanceNote: string | null;
  sessionId: string | null;
  canStart: boolean;
  canCancel: boolean;
}

/**
 * Project a room + its live session onto the board, as of `now`.
 *
 * This is the ONLY place a countdown number is produced. Clients call it with
 * their local clock purely for smooth ticking between server pushes; the
 * absolute timestamps it reads all came from the server, so a client whose clock
 * is off is visibly off by that amount and nothing more — it can never invent a
 * state the server does not hold.
 */
export function deriveRoomView(
  room: RoomSnapshot,
  session: SessionSnapshot | null,
  now: Date,
): RoomView {
  const base = {
    roomId: room.id,
    name: room.name,
    roomTypeKey: room.roomTypeKey,
    equipmentLabel: room.equipmentLabel,
    manufacturer: room.manufacturer,
    image: room.image,
    state: room.state,
    stateLabel: ROOM_STATE_LABEL[room.state],
    customerName: session?.customerName ?? null,
    isManual: session?.startedBy === 'manual_equipment',
    maintenanceNote: room.maintenanceNote,
    sessionId: session?.id ?? null,
  };

  if (room.state === 'maintenance') {
    return {
      ...base,
      phase: 'maintenance',
      remainingSec: 0,
      totalSec: 0,
      canStart: false,
      canCancel: false,
    };
  }

  if (room.state === 'in_session' && session) {
    // Delay phase: the Session exists but lamps are not on yet.
    if (session.state === 'pending') {
      const delayEndsAt = new Date(
        new Date(session.createdAt).getTime() + session.delayMinutes * 60_000,
      );
      return {
        ...base,
        phase: 'delay',
        remainingSec: secondsUntil(delayEndsAt, now),
        totalSec: session.delayMinutes * 60,
        canStart: false,
        canCancel: true,
      };
    }
    return {
      ...base,
      phase: 'running',
      remainingSec: secondsUntil(session.endsAt, now),
      totalSec: (session.equipmentMinutes ?? session.requestedMinutes) * 60,
      canStart: false,
      canCancel: true,
    };
  }

  if (room.state === 'cleaning') {
    return {
      ...base,
      phase: 'cleaning',
      remainingSec: secondsUntil(session?.cleaningEndsAt ?? null, now),
      totalSec: room.cleaningMinutes * 60,
      canStart: false,
      canCancel: false,
    };
  }

  return {
    ...base,
    phase: 'idle',
    remainingSec: 0,
    totalSec: 0,
    canStart: true,
    canCancel: false,
  };
}
