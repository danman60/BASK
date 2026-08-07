import 'server-only';

import { prisma } from './prisma';

/**
 * Throwaway fixture for the step 7 harness: one obviously-test salon with eight
 * rooms and a simulated equipment device per room.
 *
 * This is NOT the demo fixture set (`packages/db/fixtures`, step 4, another
 * lane). It exists so this harness proves the state machine against data it owns
 * and cannot be starved by whatever order the lanes land in.
 *
 * Everything is an upsert keyed on stable slugs/names, so it is safe to run on
 * every page load, and it heals itself after a `demo:reset` wipes bask data
 * mid-run. Room types use `createMany({ skipDuplicates: true })` so if the
 * fixtures lane already seeded the global `room_type` lookup, theirs wins.
 */

export const TEST_ORG_SLUG = 'test-lane-c';
export const TEST_SALON_SLUG = 'test-lane-c-salon';
export const TEST_SALON_NAME = 'TEST-LANE-C Salon';

/**
 * Harness timings, deliberately compressed. Real salons clean for 5 minutes; at
 * that length nobody can watch a full ready → in_session → cleaning → ready lap
 * in a demo. One minute keeps the whole cycle observable.
 */
const HARNESS_CLEANING_MINUTES = 1;

interface RoomSeed {
  name: string;
  roomTypeKey: string;
  sortOrder: number;
}

const ROOM_TYPES = [
  { key: 'uv_level2', label: 'Lie-down bed', category: 'uv', defaultMinutes: 12, sortOrder: 10 },
  {
    key: 'uv_stand_up',
    label: 'Stand-up booth',
    category: 'uv',
    defaultMinutes: 10,
    sortOrder: 20,
  },
  {
    key: 'spray',
    label: 'Spray booth',
    category: 'spray',
    defaultMinutes: 15,
    sortOrder: 30,
  },
  { key: 'red_light', label: 'Red light', category: 'wellness', defaultMinutes: 20, sortOrder: 40 },
];

/**
 * Eight rooms — the count DESIGN_SPEC §3.2 and PRODUCT_SPEC §20 both assume.
 *
 * Room-type keys must match the ones the FIXTURE generator seeds
 * (uv_level1/2/3, uv_stand_up, spray, red_light, hydromassage). This harness
 * originally invented its own (`uv_lie_down`, `spray_booth`); after a
 * `demo:reset` those types no longer existed, every room insert failed its
 * foreign key, and the board silently rendered zero rooms.
 */
const ROOMS: RoomSeed[] = [
  { name: 'Bed 1', roomTypeKey: 'uv_level2', sortOrder: 10 },
  { name: 'Bed 2', roomTypeKey: 'uv_level2', sortOrder: 20 },
  { name: 'Bed 3', roomTypeKey: 'uv_level2', sortOrder: 30 },
  { name: 'Stand-up 1', roomTypeKey: 'uv_stand_up', sortOrder: 40 },
  { name: 'Stand-up 2', roomTypeKey: 'uv_stand_up', sortOrder: 50 },
  { name: 'Spray Booth', roomTypeKey: 'spray', sortOrder: 60 },
  { name: 'Red Light 1', roomTypeKey: 'red_light', sortOrder: 70 },
  { name: 'Red Light 2', roomTypeKey: 'red_light', sortOrder: 80 },
];

/**
 * Per-unit simulation config, stored on the existing `equipment_device.config`
 * JSON column so the driver's behaviour is data, not code. Manual-start lengths
 * are short for the same reason cleaning is: a harness that ties a room up for
 * 12 minutes is a harness nobody watches.
 */
const SIM_CONFIG = {
  manualMinuteChoices: [2, 3, 5],
  cooldownSec: HARNESS_CLEANING_MINUTES * 60,
  maxMinutes: 30,
};

export interface SeededSalon {
  salonId: string;
  salonName: string;
  roomCount: number;
  created: boolean;
}

export async function ensureTestSalon(): Promise<SeededSalon> {
  const existing = await prisma.salon.findUnique({
    where: { slug: TEST_SALON_SLUG },
    select: { id: true, _count: { select: { rooms: true } } },
  });

  const org = await prisma.org.upsert({
    where: { slug: TEST_ORG_SLUG },
    update: {},
    create: { slug: TEST_ORG_SLUG, name: 'TEST-LANE-C Org' },
    select: { id: true },
  });

  const salon = await prisma.salon.upsert({
    where: { slug: TEST_SALON_SLUG },
    update: { orgId: org.id, name: TEST_SALON_NAME },
    create: {
      orgId: org.id,
      slug: TEST_SALON_SLUG,
      name: TEST_SALON_NAME,
      timezone: 'America/New_York',
      status: 'active',
    },
    select: { id: true, name: true },
  });

  // Global lookup table shared with the fixtures lane — never overwrite theirs.
  await prisma.roomType.createMany({ data: ROOM_TYPES, skipDuplicates: true });

  for (const room of ROOMS) {
    const row = await prisma.room.upsert({
      where: { salonId_name: { salonId: salon.id, name: room.name } },
      update: {
        roomTypeKey: room.roomTypeKey,
        sortOrder: room.sortOrder,
        cleaningMinutes: HARNESS_CLEANING_MINUTES,
        isActive: true,
      },
      create: {
        salonId: salon.id,
        name: room.name,
        roomTypeKey: room.roomTypeKey,
        sortOrder: room.sortOrder,
        cleaningMinutes: HARNESS_CLEANING_MINUTES,
        state: 'ready',
      },
      select: { id: true },
    });

    // The simulator addresses units by room id; a real bus would use its own
    // address here and nothing else about this harness would change.
    await prisma.equipmentDevice.upsert({
      where: { roomId: row.id },
      update: { driverType: 'simulated', address: row.id, config: SIM_CONFIG },
      create: {
        salonId: salon.id,
        roomId: row.id,
        driverType: 'simulated',
        address: row.id,
        config: SIM_CONFIG,
      },
    });
  }

  return {
    salonId: salon.id,
    salonName: salon.name,
    roomCount: ROOMS.length,
    created: !existing || existing._count.rooms < ROOMS.length,
  };
}

/**
 * Hard reset of the harness salon: drop its sessions and put every room back to
 * `ready`. Used by the "Reset floor" button so a wedged demo recovers without a
 * server restart. Scoped to the test salon by id — it can never touch fixture
 * data belonging to another lane.
 */
export async function resetTestFloor(salonId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { salonId } });
  await prisma.room.updateMany({
    where: { salonId },
    data: { state: 'ready', maintenanceNote: null },
  });
}
