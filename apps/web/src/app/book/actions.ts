'use server';

import { db } from '@bask/db';
import { HERO_SALON_ID } from '@bask/db/fixtures';

/**
 * Public booking — the customer-facing surface (PRODUCT_SPEC §17, M1 lane 6).
 *
 * Writes a real `Booking` row that the Floor's Schedule renders immediately: the
 * point of the beat is that a stranger on their phone lands on the front desk's
 * screen, not that a confirmation page appears. Confirmation email/SMS is
 * simulated per the M1 scope tiers — the interaction is real, the delivery is not.
 */

export interface BookableService {
  id: string;
  name: string;
  category: string;
  minutes: number;
  price: string;
}

export interface BookableSlot {
  /** ISO instant the slot starts at. */
  startsAt: string;
  /** Salon-local label, e.g. "2:15 pm". */
  label: string;
}

/**
 * Salon-local wall time → the UTC instant to store.
 *
 * Derived from the zone itself rather than a hardcoded offset, so it stays right
 * across the DST change instead of silently drifting an hour in November.
 */
function zonedToUtc(dayKey: string, localMinutes: number, zone: string): Date {
  const hh = String(Math.floor(localMinutes / 60)).padStart(2, '0');
  const mm = String(localMinutes % 60).padStart(2, '0');
  const naive = new Date(`${dayKey}T${hh}:${mm}:00Z`);
  const shown = new Date(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(naive)
      .replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6Z'),
  );
  return new Date(naive.getTime() + (naive.getTime() - shown.getTime()));
}

async function heroSalon() {
  const salon = await db.salon.findUnique({
    where: { id: HERO_SALON_ID },
    select: { id: true, name: true, timezone: true, city: true, region: true, phone: true },
  });
  if (!salon) throw new Error('No salon seeded. Run `pnpm demo:reset`.');
  return salon;
}

export async function loadBookingPage(): Promise<{
  salon: { name: string; city: string | null; region: string | null; phone: string | null };
  services: BookableService[];
}> {
  const salon = await heroSalon();
  const services = await db.service.findMany({
    where: { salonId: salon.id, isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, category: true, durationMinutes: true, price: true },
  });

  return {
    salon: { name: salon.name, city: salon.city, region: salon.region, phone: salon.phone },
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      minutes: s.durationMinutes,
      price: s.price.toFixed(2),
    })),
  };
}

/**
 * Slots for a chosen day, on the demo clock rather than wall-clock time.
 *
 * A booking page that offers real "today" while the rest of the product sits on
 * the virtual clock would put the customer's booking on a day the Floor is not
 * showing — the one thing this beat exists to demonstrate.
 */
export async function loadSlots(serviceId: string, dayOffset: number): Promise<BookableSlot[]> {
  const salon = await heroSalon();
  const demo = await db.demoState.findUnique({ where: { id: 'default' } });
  if (!demo) throw new Error('No demo clock. Run `pnpm demo:reset`.');

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true, roomTypeKey: true },
  });
  if (!service) throw new Error('Unknown service.');

  const day = new Date(demo.virtualToday);
  day.setUTCDate(day.getUTCDate() + dayOffset);

  // Rooms this service can actually run in — a spray booking must not be offered
  // a slot that only a UV bed could fill.
  const rooms = await db.room.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
      ...(service.roomTypeKey ? { roomTypeKey: service.roomTypeKey } : {}),
    },
    select: { id: true },
  });
  if (rooms.length === 0) return [];

  const dayStart = new Date(day);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const dayKey = dayStart.toISOString().slice(0, 10);

  const taken = await db.booking.findMany({
    where: {
      salonId: salon.id,
      state: { in: ['booked', 'arrived'] },
      startsAt: { gte: dayStart, lt: dayEnd },
      roomId: { in: rooms.map((r) => r.id) },
    },
    select: { startsAt: true, endsAt: true, roomId: true },
  });

  const slots: BookableSlot[] = [];
  const step = 15;
  for (let minutes = 10 * 60; minutes + service.durationMinutes <= 19 * 60; minutes += step) {
    // `minutes` is SALON-LOCAL wall time. The Floor renders bookings in the salon's
    // zone, so a slot built from raw UTC hours would advertise 2:15 pm and show up
    // on the front desk seven hours out.
    const startsAt = zonedToUtc(dayKey, minutes, salon.timezone);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

    const free = rooms.some(
      (room) =>
        !taken.some(
          (b) => b.roomId === room.id && b.startsAt < endsAt && b.endsAt > startsAt,
        ),
    );
    if (!free) continue;

    slots.push({
      startsAt: startsAt.toISOString(),
      label: new Intl.DateTimeFormat('en-CA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: salon.timezone,
      }).format(startsAt),
    });
  }
  return slots;
}

export interface BookingResult {
  ok: boolean;
  message: string;
  when?: string;
  service?: string;
}

export async function createBooking(input: {
  serviceId: string;
  startsAt: string;
  name: string;
  contact: string;
}): Promise<BookingResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, message: 'Please tell us your name so we know who to expect.' };

  const salon = await heroSalon();
  const service = await db.service.findUnique({
    where: { id: input.serviceId },
    select: { id: true, name: true, durationMinutes: true, roomTypeKey: true },
  });
  if (!service) return { ok: false, message: 'That service is no longer available.' };

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  const rooms = await db.room.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
      ...(service.roomTypeKey ? { roomTypeKey: service.roomTypeKey } : {}),
    },
    select: { id: true },
  });

  const clashes = await db.booking.findMany({
    where: {
      salonId: salon.id,
      state: { in: ['booked', 'arrived'] },
      roomId: { in: rooms.map((r) => r.id) },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { roomId: true },
  });
  const room = rooms.find((r) => !clashes.some((c) => c.roomId === r.id));
  if (!room) {
    return { ok: false, message: 'Somebody just took that time. Pick another and we will hold it.' };
  }

  // Match an existing customer on contact so a regular's booking lands on their
  // own record rather than creating a duplicate the front desk has to merge.
  const contact = input.contact.trim();
  const existing = contact
    ? await db.customer.findFirst({
        where: {
          salonId: salon.id,
          OR: [{ email: { equals: contact, mode: 'insensitive' } }, { phone: contact }],
        },
        // Two records can share a phone (a couple, a family). Oldest wins so the
        // same contact always resolves to the same person rather than whichever
        // row Postgres happened to return.
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
    : null;

  await db.booking.create({
    data: {
      salonId: salon.id,
      customerId: existing?.id ?? null,
      serviceId: service.id,
      roomId: room.id,
      state: 'booked',
      source: 'online_booking',
      guestName: existing ? null : name,
      startsAt,
      endsAt,
      minutes: service.durationMinutes,
      notes: contact ? `Booked online · ${contact}` : 'Booked online',
    },
  });

  const label = new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: salon.timezone,
  }).format(startsAt);

  return { ok: true, message: 'You are booked.', when: label, service: service.name };
}
