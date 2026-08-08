'use client';

import { formatCountdown, type RoomView } from '@bask/core/sessions';

import { FLOOR } from '../copy';

/**
 * The room board (DESIGN_SPEC §3.2).
 *
 * Card anatomy is fixed: equipment type → room name → state zone. The room name
 * is the real UVALUX machine ("Ergoline Sunrise 7200") with its own photograph,
 * because the board is the first thing the pitch shows and a made-up bed name is
 * the first thing a dealer would notice. The
 * `.in-session-ring` gradient rim is the only colour-loud element, which is what
 * lets the board read from across a counter — the eye finds the running beds
 * before it reads a word.
 *
 * It renders and does not decide. Every value here came from `deriveRoomView()`
 * over server-supplied rows.
 */

export function RoomBoard({
  views,
  busy,
  onCancel,
  onMaintenance,
}: {
  views: RoomView[];
  busy: boolean;
  onCancel: (roomId: string) => void;
  onMaintenance: (roomId: string, on: boolean) => void;
}) {
  if (views.length === 0) {
    return (
      <div className="floor-empty">
        <h3>{FLOOR.board.emptyTitle}</h3>
        <p>{FLOOR.board.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="floor-grid">
      {views.map((view) => (
        <div className="room-slot" key={view.roomId}>
          {view.phase === 'running' || view.phase === 'delay' ? (
            <div className="in-session-ring">
              <RoomCard view={view} busy={busy} onCancel={onCancel} onMaintenance={onMaintenance} />
            </div>
          ) : (
            <RoomCard view={view} busy={busy} onCancel={onCancel} onMaintenance={onMaintenance} />
          )}
        </div>
      ))}
    </div>
  );
}

function RoomCard({
  view,
  busy,
  onCancel,
  onMaintenance,
}: {
  view: RoomView;
  busy: boolean;
  onCancel: (roomId: string) => void;
  onMaintenance: (roomId: string, on: boolean) => void;
}) {
  const running = view.phase === 'running' || view.phase === 'delay';

  return (
    <article className="room">
      {/* The make is only worth a line when the machine name does not already
          carry it — "UV · Level 3 · Ergoline / Ergoline Sunrise 7200" says it twice. */}
      <span className="type">
        {view.equipmentLabel}
        {view.manufacturer && !view.name.startsWith(view.manufacturer)
          ? ` · ${view.manufacturer}`
          : ''}
      </span>
      <div className="room-id">
        {view.image && (
          <img className="machine" src={view.image} alt="" loading="lazy" decoding="async" />
        )}
        <h3>{view.name}</h3>
      </div>

      <div className="state">
        {running && (
          <>
            <span className="countdown num">{formatCountdown(view.remainingSec)}</span>
            <span className="mins">{FLOOR.board.left}</span>
          </>
        )}
        {view.state === 'ready' && <span className="chip ready">{FLOOR.legend.ready}</span>}
        {view.phase === 'cleaning' && (
          <span className="chip clean">
            {FLOOR.legend.cleaning} · {Math.max(1, Math.ceil(view.remainingSec / 60))} min
          </span>
        )}
        {view.state === 'maintenance' && (
          <span className="chip maint">{FLOOR.legend.maintenance}</span>
        )}
      </div>

      {view.customerName && <span className="who">{view.customerName}</span>}
      {view.isManual && running && <span className="manual-note">{FLOOR.board.manual}</span>}
      {view.maintenanceNote && <span className="manual-note">{view.maintenanceNote}</span>}

      <div className="room-actions">
        {view.canCancel && (
          <button type="button" disabled={busy} onClick={() => onCancel(view.roomId)}>
            {FLOOR.board.endSession}
          </button>
        )}
        {view.state !== 'in_session' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMaintenance(view.roomId, view.state !== 'maintenance')}
          >
            {view.state === 'maintenance' ? FLOOR.board.backInService : FLOOR.board.outOfService}
          </button>
        )}
      </div>
    </article>
  );
}
