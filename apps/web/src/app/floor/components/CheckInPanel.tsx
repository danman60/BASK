'use client';

import { useMemo, useState } from 'react';
import type { RoomView } from '@bask/core/sessions';

import type { CustomerCard, CustomerIndexEntry, ServiceOption } from '@/server/floor/floor-data';

import { FLOOR } from '../copy';

/**
 * The check-in panel (DESIGN_SPEC §3.2 anatomy, mockup 02 right column).
 *
 * Order is load-bearing and matches the mockup exactly: header → 2×2 meta grid →
 * flags → upsell whisper → SERVICE → READY ROOMS → the outcome-stating button.
 * Staff learn the shape, not the labels.
 *
 * Search filters an index the server sent with the page. No round trip, no
 * debounce, no spinner — DESIGN_SPEC §3.2's "<100ms perceived" is met by not
 * doing any work at all.
 */

export function CustomerSearch({
  customers,
  onPick,
  autoFocus = false,
}: {
  customers: CustomerIndexEntry[];
  onPick: (customer: CustomerIndexEntry) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const digits = q.replace(/\D/g, '');
    const needle = digits.length >= 3 ? digits : q;
    return customers.filter((c) => c.search.includes(needle)).slice(0, 40);
  }, [customers, query]);

  return (
    <div className="floor-search">
      <label className="floor-field" style={{ marginBottom: 0 }}>
        <span className="k">{FLOOR.checkin.searchLabel}</span>
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          placeholder={FLOOR.checkin.searchPlaceholder}
          onChange={(e) => setQuery(e.target.value)}
          // A wedge scan must never land in the search box as text.
          autoComplete="off"
        />
      </label>

      {query.trim().length >= 2 && (
        <ul className="floor-results">
          {matches.length === 0 && (
            <li>
              <span style={{ display: 'block', padding: '10px 12px', color: 'var(--ink-faint)' }}>
                {FLOOR.checkin.noMatch}
              </span>
            </li>
          )}
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(c);
                  setQuery('');
                }}
              >
                <span className="pav" style={{ width: 28, height: 28, fontSize: 11 }}>
                  {c.initials}
                </span>
                <span className="who">
                  {c.firstName} {c.lastName}
                </span>
                {c.membershipTier && (
                  <span className="member-badge" style={{ marginTop: 0 }}>
                    <i />
                    {titleCase(c.membershipTier)}
                  </span>
                )}
                <span className="sub">{c.phone ?? c.email ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CheckInPanel({
  card,
  services,
  rooms,
  busy,
  onStart,
  onOpenWaiver,
  onSellUpsell,
}: {
  card: CustomerCard | null;
  services: ServiceOption[];
  rooms: RoomView[];
  busy: boolean;
  onStart: (input: { serviceId: string; roomId: string; minutes: number }) => void;
  onOpenWaiver: () => void;
  onSellUpsell: (productId: string) => void;
}) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [upsellHidden, setUpsellHidden] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? null;

  // Only rooms that fit the chosen service can take it — offering a spray booth
  // for a red-light session would be a lie the staffer discovers at the bed.
  const eligible = useMemo(() => {
    const free = rooms.filter((r) => r.canStart);
    if (!service?.roomTypeKey) return free;
    const matching = free.filter((r) => r.roomTypeKey === service.roomTypeKey);
    return matching.length > 0 ? matching : [];
  }, [rooms, service]);

  const nextUp = useMemo(
    () =>
      rooms
        .filter((r) => r.phase === 'cleaning' && (!service?.roomTypeKey || r.roomTypeKey === service.roomTypeKey))
        .sort((a, b) => a.remainingSec - b.remainingSec)
        .slice(0, 1),
    [rooms, service],
  );

  if (!card) {
    return (
      <aside className="panel">
        <div className="panel-body">
          <div className="floor-empty" style={{ border: 0, padding: 0 }}>
            <h3>{FLOOR.checkin.emptyTitle}</h3>
            <p>{FLOOR.checkin.emptyBody}</p>
          </div>
        </div>
      </aside>
    );
  }

  const chosenRoom = eligible.find((r) => r.roomId === roomId) ?? null;
  /**
   * The timing verdict warns; it does not block.
   *
   * The 24-hour gap is a real rule, but the person who decides whether it
   * applies is the staffer looking at the customer — the record can be wrong,
   * the previous session can have been two minutes of a cold bed, and a hard
   * refusal at the desk with a queue behind it just teaches people to work
   * around the software. The warning is loud and states the rule; the decision
   * stays with the human. It also only applies to UV, which is why it is shown
   * against the chosen service rather than the customer in the abstract.
   */
  const uvWarning = card.timing.tone === 'wait' && service?.category === 'uv';
  const canStart = Boolean(service && chosenRoom);

  return (
    <aside className="panel">
      <div className="panel-head">
        <div className="pav">{card.initials}</div>
        <div>
          <h2>
            {card.firstName} {card.lastName}
          </h2>
          {card.membership && (
            <span className="member-badge">
              <i />
              {titleCase(card.membership.tier)} — {membershipWord(card.membership)}
            </span>
          )}
        </div>
      </div>

      <div className="panel-body">
        <div className="meta">
          <div>
            <div className="k">{FLOOR.checkin.lastVisit}</div>
            <div className="v">{card.lastVisitLabel}</div>
          </div>
          <div>
            <div className="k">{FLOOR.checkin.visitsThisMonth}</div>
            <div className="v num">{card.visitsThisMonth}</div>
          </div>
          <div>
            <div className="k">{FLOOR.checkin.packageLabel}</div>
            <div className="v num">{card.packageLabel ?? FLOOR.checkin.noPackage}</div>
          </div>
          <div>
            <div className="k">{FLOOR.checkin.timing}</div>
            <div className={`v ${card.timing.tone}`}>{card.timing.verdict}</div>
          </div>
        </div>

        {card.waiver.note && (
          <div className={`flag${card.waiver.tone === 'risk' ? ' risk' : ''}`}>
            <span aria-hidden>⚠</span>
            <span>{card.waiver.note}</span>
            <button type="button" onClick={onOpenWaiver}>
              {FLOOR.waiver.open}
            </button>
          </div>
        )}
        {!card.waiver.note && (
          <div className="hint">
            <span aria-hidden>✓</span>
            <span>
              Waiver {card.waiver.label.toLowerCase()}.{' '}
            </span>
            <button type="button" onClick={onOpenWaiver}>
              {FLOOR.waiver.view}
            </button>
          </div>
        )}

        {card.upsell && !upsellHidden && (
          <div className="hint">
            <span aria-hidden>✦</span>
            <span>
              {card.upsell.note.split(card.upsell.productName).map((part, i, all) => (
                <span key={i}>
                  {part}
                  {i < all.length - 1 && <strong>{card.upsell!.productName}</strong>}
                </span>
              ))}
            </span>
            <button type="button" onClick={() => onSellUpsell(card.upsell!.productId)}>
              Add to cart
            </button>
            <button type="button" onClick={() => setUpsellHidden(true)}>
              {FLOOR.checkin.dismissUpsell}
            </button>
          </div>
        )}

        <div className="sect">{FLOOR.checkin.service}</div>
        <div className="svc-row">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`svc${s.id === serviceId ? ' sel' : ''}`}
              onClick={() => {
                setServiceId(s.id);
                setRoomId(null);
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {uvWarning && (
          <div className="flag risk">
            <span aria-hidden>⚠</span>
            <span>
              <strong>{card.timing.verdict}.</strong> {card.timing.detail}
            </span>
          </div>
        )}

        <div className="sect">{FLOOR.checkin.readyRooms}</div>
        <div className="rooms-row">
          {eligible.map((r) => (
            <button
              key={r.roomId}
              type="button"
              className={`rm${r.roomId === roomId ? ' sel' : ''}`}
              onClick={() => setRoomId(r.roomId)}
            >
              {r.name}
            </button>
          ))}
          {nextUp.map((r) => (
            <button key={r.roomId} type="button" className="rm" disabled>
              {r.name} · in {Math.max(1, Math.ceil(r.remainingSec / 60))} min
            </button>
          ))}
          {eligible.length === 0 && nextUp.length === 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
              {FLOOR.checkin.noReadyRooms}
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary start"
          disabled={!canStart || busy}
          onClick={() =>
            service &&
            chosenRoom &&
            onStart({ serviceId: service.id, roomId: chosenRoom.roomId, minutes: service.minutes })
          }
        >
          {canStart && service && chosenRoom
            ? FLOOR.checkin.start(chosenRoom.name, service.minutes)
            : FLOOR.checkin.startBlocked}
        </button>
      </div>
    </aside>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function membershipWord(m: NonNullable<CustomerCard['membership']>): string {
  if (m.paymentState === 'failed') return 'payment failed';
  if (m.status === 'frozen') return 'on hold';
  return 'active';
}
