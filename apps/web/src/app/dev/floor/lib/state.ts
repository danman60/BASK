import 'server-only';

import type { RoomSnapshot, SessionSnapshot } from '@bask/core/sessions';
import { ACTIVE_SESSION_STATES } from '@bask/core/sessions';

import { prisma } from './prisma';

/**
 * The wire format between server and board.
 *
 * It carries *snapshots plus absolute timestamps*, not pre-rendered countdown
 * numbers. The client re-derives the view every animation frame via
 * `deriveRoomView`, using the same pure function the server uses, so the two can
 * never disagree about what a state means — only about what time it is, and
 * `serverNow` lets the client correct for that too.
 *
 * This is what makes "state survives page reload" true rather than lucky: there
 * is no client-side timer holding the truth, only a projection of rows.
 */
export interface FloorState {
  salonId: string;
  salonName: string;
  /** Server wall clock at the moment this snapshot was read. */
  serverNow: string;
  /** Monotonic per-process counter; lets the client drop out-of-order pushes. */
  version: number;
  rooms: RoomSnapshot[];
  /** Live session per room id, or null. Only ever one active session per room. */
  sessions: Record<string, SessionSnapshot | null>;
  /** Newest sessions regardless of state — proof that manual starts landed. */
  recent: RecentSession[];
  driver: { type: string; apiVersion: string; unitCount: number } | null;
}

export interface RecentSession {
  id: string;
  roomName: string;
  state: string;
  startedBy: string;
  requestedMinutes: number;
  customerName: string | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
}

export async function readFloorState(
  salonId: string,
  salonName: string,
  version: number,
  driver: FloorState['driver'],
): Promise<FloorState> {
  const [rooms, active, recent] = await Promise.all([
    prisma.room.findMany({
      where: { salonId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        roomTypeKey: true,
        state: true,
        maintenanceNote: true,
        cleaningMinutes: true,
        sortOrder: true,
        roomType: { select: { label: true } },
        equipmentDevice: { select: { address: true } },
      },
    }),
    prisma.session.findMany({
      where: { salonId, state: { in: [...ACTIVE_SESSION_STATES] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        roomId: true,
        state: true,
        startedBy: true,
        requestedMinutes: true,
        equipmentMinutes: true,
        delayMinutes: true,
        createdAt: true,
        startedAt: true,
        endsAt: true,
        cleaningEndsAt: true,
        customer: { select: { firstName: true } },
      },
    }),
    prisma.session.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        state: true,
        startedBy: true,
        requestedMinutes: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        notes: true,
        room: { select: { name: true } },
        customer: { select: { firstName: true } },
      },
    }),
  ]);

  const sessions: Record<string, SessionSnapshot | null> = {};
  for (const room of rooms) sessions[room.id] = null;
  for (const s of active) {
    // `findMany` is newest-first, so the first hit per room wins if a bug ever
    // leaves two active sessions on one room. The sweep repairs it next tick.
    if (sessions[s.roomId]) continue;
    sessions[s.roomId] = {
      id: s.id,
      roomId: s.roomId,
      state: s.state,
      startedBy: s.startedBy,
      requestedMinutes: s.requestedMinutes,
      equipmentMinutes: s.equipmentMinutes,
      delayMinutes: s.delayMinutes,
      customerName: s.customer?.firstName ?? null,
      createdAt: s.createdAt.toISOString(),
      startedAt: s.startedAt?.toISOString() ?? null,
      endsAt: s.endsAt?.toISOString() ?? null,
      cleaningEndsAt: s.cleaningEndsAt?.toISOString() ?? null,
    };
  }

  return {
    salonId,
    salonName,
    serverNow: new Date().toISOString(),
    version,
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      roomTypeKey: r.roomTypeKey,
      equipmentLabel: r.roomType?.label ?? r.roomTypeKey,
      state: r.state,
      maintenanceNote: r.maintenanceNote,
      cleaningMinutes: r.cleaningMinutes,
      sortOrder: r.sortOrder,
      unit: r.equipmentDevice?.address ?? null,
    })),
    sessions,
    recent: recent.map((s) => ({
      id: s.id,
      roomName: s.room.name,
      state: s.state,
      startedBy: s.startedBy,
      requestedMinutes: s.requestedMinutes,
      customerName: s.customer?.firstName ?? null,
      createdAt: s.createdAt.toISOString(),
      startedAt: s.startedAt?.toISOString() ?? null,
      endedAt: s.endedAt?.toISOString() ?? null,
      notes: s.notes,
    })),
    driver,
  };
}
