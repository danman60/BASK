'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  createBooking,
  loadSlots,
  type BookableService,
  type BookableSlot,
} from './actions';

/**
 * The customer's side of Bask (PRODUCT_SPEC §17: "the software should improve the
 * customer's experience quietly").
 *
 * Three decisions and a name — service, day, time — because the person using this
 * is standing in a parking lot on a phone, not sitting at a desk. No account, no
 * password, no upsell. The salon's own booking beat is that this lands on the
 * front desk's Schedule the moment it is confirmed.
 */
export function BookFlow({
  salon,
  services,
}: {
  salon: { name: string; city: string | null; region: string | null; phone: string | null };
  services: BookableService[];
}) {
  const [service, setService] = useState<BookableService | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [slots, setSlots] = useState<BookableSlot[] | null>(null);
  const [slot, setSlot] = useState<BookableSlot | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [done, setDone] = useState<{ when: string; service: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!service) return;
    setSlots(null);
    setSlot(null);
    let cancelled = false;
    loadSlots(service.id, dayOffset)
      .then((next) => {
        if (!cancelled) setSlots(next);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [service, dayOffset]);

  if (done) {
    return (
      <section className="book-done">
        <p className="book-eyebrow">You&rsquo;re booked</p>
        <h1>See you {done.when}.</h1>
        <p className="book-lede">
          {done.service} at {salon.name}. We&rsquo;ve got your spot held — just come in a couple of
          minutes early the first time.
        </p>
        <p className="book-note">
          Need to change it? Call {salon.phone ?? 'the salon'} and we&rsquo;ll sort it out.
        </p>
      </section>
    );
  }

  const days = [0, 1, 2, 3, 4, 5, 6];

  return (
    <section className="book">
      <header className="book-head">
        <p className="book-eyebrow">{salon.name}</p>
        <h1>Book a session</h1>
        <p className="book-lede">
          Pick what you want and when. Takes about twenty seconds — no account needed.
        </p>
      </header>

      <div className="book-step">
        <h2>1 &middot; What are you in for?</h2>
        <div className="book-services">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`book-service${service?.id === s.id ? ' is-selected' : ''}`}
              onClick={() => setService(s)}
              aria-pressed={service?.id === s.id}
            >
              <span className="book-service-name">{s.name}</span>
              <span className="book-service-meta">
                {s.minutes} min &middot; ${s.price}
              </span>
            </button>
          ))}
        </div>
      </div>

      {service && (
        <div className="book-step">
          <h2>2 &middot; When suits you?</h2>
          <div className="book-days">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                className={`book-day${dayOffset === d ? ' is-selected' : ''}`}
                onClick={() => setDayOffset(d)}
                aria-pressed={dayOffset === d}
              >
                {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`}
              </button>
            ))}
          </div>

          {slots === null && <p className="book-note">Finding open times&hellip;</p>}
          {slots?.length === 0 && (
            <p className="book-note">
              Nothing free that day for {service.name}. Try another — most days have plenty.
            </p>
          )}
          {slots && slots.length > 0 && (
            <div className="book-slots">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  className={`book-slot${slot?.startsAt === s.startsAt ? ' is-selected' : ''}`}
                  onClick={() => setSlot(s)}
                  aria-pressed={slot?.startsAt === s.startsAt}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {service && slot && (
        <div className="book-step">
          <h2>3 &middot; Who should we expect?</h2>
          <div className="book-fields">
            <label className="book-field">
              <span>Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last"
                autoComplete="name"
              />
            </label>
            <label className="book-field">
              <span>Phone or email</span>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="So we can reach you if anything changes"
                autoComplete="tel"
              />
            </label>
          </div>

          {error && <p className="book-error">{error}</p>}

          <button
            type="button"
            className="book-confirm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await createBooking({
                  serviceId: service.id,
                  startsAt: slot.startsAt,
                  name,
                  contact,
                });
                if (result.ok) {
                  setDone({ when: result.when!, service: result.service! });
                } else {
                  setError(result.message);
                  // A clash means the grid is stale — refetch rather than leaving
                  // a slot on screen that somebody already took.
                  loadSlots(service.id, dayOffset).then(setSlots).catch(() => {});
                }
              })
            }
          >
            {pending ? 'Holding your spot…' : `Book ${slot.label} — ${service.name}`}
          </button>
          <p className="book-note">
            Nothing is charged now. You pay at the salon like always.
          </p>
        </div>
      )}
    </section>
  );
}
