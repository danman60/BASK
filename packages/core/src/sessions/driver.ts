/**
 * `EquipmentDriver` — the one seam between session logic and tanning hardware
 * (IMPLEMENTATION_SPEC §5.2).
 *
 * The five methods below are reproduced verbatim from the spec. Everything the
 * Floor does goes through them, so the room board is byte-identical whether a
 * `SimulatedDriver` (M0, demo) or a `TMaxDriver` (M4, bench-verified) is behind
 * it. No caller may branch on which driver is installed.
 *
 * Session authority is NOT here. Drivers report; the cloud decides. A driver may
 * be wrong, late, or offline — the server reconciles against its own Session
 * rows and never lets the board claim a state it cannot see.
 */

import type { Ack, UnitAddress, UnitEvent, UnitInfo, UnitStatus, Unsubscribe } from './types';

export interface EquipmentDriver {
  listUnits(): Promise<UnitInfo[]>;
  startSession(unit: UnitAddress, minutes: number, delayMin?: number): Promise<Ack>;
  cancelSession(unit: UnitAddress): Promise<Ack>;
  getStatus(unit: UnitAddress): Promise<UnitStatus>; // idle | delay | running(remaining) | cooldown | fault
  onEvent(cb: (e: UnitEvent) => void): Unsubscribe;
}

/**
 * Metadata every driver carries so the server can log and gate on it. Kept
 * separate from `EquipmentDriver` so the spec's interface stays literal.
 */
export interface EquipmentDriverMeta {
  /** `bask.equipment_driver_type` value: `simulated` | `tmax` | `other`. */
  readonly driverType: string;
  /** `EQUIPMENT_DRIVER_API_VERSION` this driver was written against. */
  readonly apiVersion: string;
}

/** A driver that also reports its identity — what the engine actually holds. */
export type VersionedEquipmentDriver = EquipmentDriver & EquipmentDriverMeta;

/** Standard `Ack.error` codes, so callers never string-match on prose. */
export const DRIVER_ERROR = {
  UNKNOWN_UNIT: 'unknown_unit',
  UNIT_BUSY: 'unit_busy',
  UNIT_FAULTED: 'unit_faulted',
  NOTHING_TO_CANCEL: 'nothing_to_cancel',
  MINUTES_OUT_OF_RANGE: 'minutes_out_of_range',
  DELAY_UNSUPPORTED: 'delay_unsupported',
} as const;

export type DriverErrorCode = (typeof DRIVER_ERROR)[keyof typeof DRIVER_ERROR];
