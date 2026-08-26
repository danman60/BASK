'use client';

import { useMemo, useState } from 'react';
import { addDays, formatHour, weekdayName, type DateOnly } from '@bask/core';

import type { ScheduleBooking } from '@/server/floor/floor-data';

import { FLOOR } from '../copy';

/**
 * The schedule (day / week), with drag-to-rebook and capacity heat-shading.
 *
 * Shading is computed from what is actually booked against what the floor can
 * actually take — rooms × slots per hour — so a dark cell means "this hour is
 * nearly full", not "this hour has a lot of rows". An owner who cannot trust the
 * shading will not use it to decide anything.
 *
 * Drag uses the native HTML5 API rather than a library: the drop targets are a
 * grid of hour cells, which is exactly the case native drag handles well, and a
 * drag library on the Floor is weight for no gain.
 */

const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;
/** Blended turnover per room per hour (fixtures `SLOTS_PER_ROOM_HOUR`). */
const SLOTS_PER_ROOM_HOUR = 2.5;

export function SchedulePanel({
  bookings,
  today,
  zone,
  roomCount,
  busy,
  onRebook,
}: {
  bookings: ScheduleBooking[];
  today: DateOnly;
  zone: string;
  roomCount: number;
  busy: boolean;
  onRebook: (bookingId: string, startsAt: string) => void;
}) {
  const [mode, setMode] = useState<'day' | 'week'>('week');
  const [anchor, setAnchor] = useState<DateOnly>(today);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const days = useMemo(() => {
    if (mode === 'day') return [anchor];
    return Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  }, [mode, anchor]);

  const hours = useMemo(
    () => Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i),
    [],
  );

  /** booking → the `day|hour` cell it belongs in, resolved in the salon's zone. */
  const byCell = useMemo(() => {
    const map = new Map<string, ScheduleBooking[]>();
    for (const b of bookings) {
      const at = new Date(b.startsAt);
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(at);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
      const key = `${get('year')}-${get('month')}-${get('day')}|${Number(get('hour'))}`;
      const list = map.get(key);
      if (list) list.push(b);
      else map.set(key, [b]);
    }
    return map;
  }, [bookings, zone]);

  const capacityPerHour = Math.max(1, Math.round(roomCount * SLOTS_PER_ROOM_HOUR));

  const drop = (day: DateOnly, hour: number) => {
    if (!dragging) return;
    const booking = bookings.find((b) => b.id === dragging);
    setDragging(null);
    setDropTarget(null);
    if (!booking) return;
    const original = new Date(booking.startsAt);
    const minutes = Number(
      new Intl.DateTimeFormat('en-CA', { timeZone: zone, minute: '2-digit' }).format(original),
    );
    // Keep the minute-past-the-hour; only the day and hour move.
    const startsAt = zonedIso(day, hour, minutes, zone);
    onRebook(booking.id, startsAt);
  };

  return (
    <section>
      <div className="floor-head">
        <h1>{FLOOR.schedule.title}</h1>
      </div>

      <div className="sched-toolbar">
        <button
          type="button"
          className={`svc${mode === 'day' ? ' sel' : ''}`}
          onClick={() => setMode('day')}
        >
          {FLOOR.schedule.day}
        </button>
        <button
          type="button"
          className={`svc${mode === 'week' ? ' sel' : ''}`}
          onClick={() => setMode('week')}
        >
          {FLOOR.schedule.week}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => setAnchor(addDays(anchor, mode === 'day' ? -1 : -7))}
        >
          {FLOOR.schedule.prev}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setAnchor(today)}>
          {FLOOR.schedule.today}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => setAnchor(addDays(anchor, mode === 'day' ? 1 : 7))}
        >
          {FLOOR.schedule.next}
        </button>
        <span className="spacer" />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
          {FLOOR.schedule.dragHint}
        </span>
        <span className="chip accent">{FLOOR.schedule.booked}</span>
        <span className="chip quiet">{FLOOR.schedule.walkIn}</span>
      </div>

      <div className="sched">
        <div
          className="sched-inner"
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          <div className="sched-corner" />
          {days.map((day) => (
            <div className="sched-colhead" key={day}>
              <span className="d">{weekdayName(day).slice(0, 3)}</span>
              <br />
              {day.slice(5)}
              {day === today ? ' · today' : ''}
            </div>
          ))}

          {hours.map((hour) => (
            <Row
              key={hour}
              hour={hour}
              days={days}
              byCell={byCell}
              capacityPerHour={capacityPerHour}
              busy={busy}
              dragging={dragging}
              dropTarget={dropTarget}
              setDragging={setDragging}
              setDropTarget={setDropTarget}
              onDrop={drop}
            />
          ))}
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="floor-empty" style={{ marginTop: 'var(--space-5)' }}>
          <h3>{FLOOR.schedule.emptyTitle}</h3>
          <p>{FLOOR.schedule.emptyBody}</p>
        </div>
      )}
    </section>
  );
}

function Row({
  hour,
  days,
  byCell,
  capacityPerHour,
  busy,
  dragging,
  dropTarget,
  setDragging,
  setDropTarget,
  onDrop,
}: {
  hour: number;
  days: DateOnly[];
  byCell: Map<string, ScheduleBooking[]>;
  capacityPerHour: number;
  busy: boolean;
  dragging: string | null;
  dropTarget: string | null;
  setDragging: (id: string | null) => void;
  setDropTarget: (key: string | null) => void;
  onDrop: (day: DateOnly, hour: number) => void;
}) {
  return (
    <>
      <div className="sched-hour">{formatHour(hour)}</div>
      {days.map((day) => {
        const key = `${day}|${hour}`;
        const items = byCell.get(key) ?? [];
        const load = Math.min(1, items.length / capacityPerHour);
        return (
          <div
            key={key}
            className="sched-cell"
            data-drop={dropTarget === key ? 'true' : undefined}
            // Heat shading: terracotta wash whose alpha tracks how full the hour is.
            style={{ background: `oklch(58% 0.14 42 / ${(load * 0.16).toFixed(3)})` }}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              setDropTarget(key);
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(day, hour);
            }}
          >
            {items.map((b) => (
              <button
                key={b.id}
                type="button"
                className="sched-booking"
                data-source={b.source}
                draggable={!busy}
                onDragStart={() => setDragging(b.id)}
                onDragEnd={() => {
                  setDragging(null);
                  setDropTarget(null);
                }}
                title={`${b.who} · ${b.serviceName ?? ''} · ${b.roomName ?? ''}`}
              >
                {b.who}
                <span className="sub">{b.serviceName ?? ''}</span>
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}

/**
 * The UTC instant for a wall-clock time on `day` in `zone`.
 *
 * Two passes, same reason as `@bask/core`'s `zonedToUtc`: the offset can change
 * between the guess and the real instant at a DST boundary.
 */
function zonedIso(day: DateOnly, hour: number, minute: number, zone: string): string {
  const naive = Date.parse(
    `${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
  );
  let instant = naive - offsetMinutes(new Date(naive), zone) * 60_000;
  instant = naive - offsetMinutes(new Date(instant), zone) * 60_000;
  return new Date(instant).toISOString();
}

function offsetMinutes(instant: Date, zone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const out: Record<string, number> = {};
  for (const part of fmt.formatToParts(instant)) {
    if (part.type !== 'literal') out[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    out.year!,
    out.month! - 1,
    out.day!,
    out.hour! % 24,
    out.minute!,
    out.second!,
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}
