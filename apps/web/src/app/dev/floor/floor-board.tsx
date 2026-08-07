'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { deriveRoomView, formatCountdown, type RoomView } from '@bask/core/sessions';

import {
  cancelSessionAction,
  reseedAction,
  resetFloorAction,
  setMaintenanceAction,
  startSessionAction,
  triggerManualStartAction,
} from './actions';
import type { FloorState } from './lib/state';

/**
 * The room board.
 *
 * It renders. It does not decide. Every state on screen is `deriveRoomView()`
 * over server-supplied rows, and the only thing the client contributes is the
 * current time — which it takes from the server's clock plus elapsed local time,
 * so a machine with a wrong clock still shows the right countdown.
 *
 * Three inputs, in order of trust:
 *  1. Server-rendered `initialState` (authoritative at page load).
 *  2. Supabase Realtime broadcast (fast).
 *  3. A 2s poll of the state route (correct, and the recovery path when 2 fails).
 * Stale pushes are dropped by `version`, so ordering between 2 and 3 is a
 * non-issue.
 */

const POLL_MS = 2000;
const TICK_MS = 250;

const STATE_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  ready: { bg: '#e8f5ec', fg: '#1c6b3a', border: '#b6dcc4' },
  in_session: { bg: '#fff1e6', fg: '#9a4a12', border: '#f0c19a' },
  cleaning: { bg: '#fdf4dc', fg: '#8a6a12', border: '#e8d193' },
  maintenance: { bg: '#f3ece8', fg: '#7a5548', border: '#d9c7bf' },
};

export function FloorBoard({
  initialState,
  channel,
  realtimeUrl,
  realtimeKey,
}: {
  initialState: FloorState;
  channel: string;
  realtimeUrl: string | null;
  realtimeKey: string | null;
}) {
  const [state, setState] = useState<FloorState>(initialState);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>(
    realtimeUrl ? 'connecting' : 'disabled',
  );

  /**
   * `now` starts at the server's clock so the first client render is
   * byte-identical to the server HTML (no hydration mismatch), then advances
   * locally between updates. Every subsequent server payload re-anchors it.
   */
  const [now, setNow] = useState(() => new Date(initialState.serverNow).getTime());
  const anchor = useRef({
    serverMs: new Date(initialState.serverNow).getTime(),
    localMs: 0,
  });

  const applyState = useCallback((next: FloorState) => {
    setState((prev) => (next.version < prev.version ? prev : next));
    anchor.current = {
      serverMs: new Date(next.serverNow).getTime(),
      localMs: Date.now(),
    };
  }, []);

  // Local countdown tick. Purely cosmetic smoothing between server payloads —
  // it can never change a room's state, only the number of seconds shown.
  useEffect(() => {
    anchor.current.localMs = Date.now();
    const id = setInterval(() => {
      const { serverMs, localMs } = anchor.current;
      setNow(localMs === 0 ? serverMs : serverMs + (Date.now() - localMs));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Correctness path: poll.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/dev/floor/api/state', { cache: 'no-store' });
        if (!res.ok || !alive) return;
        applyState((await res.json()) as FloorState);
      } catch {
        // Offline for a beat; the next poll recovers.
      }
    };
    const id = setInterval(load, POLL_MS);
    void load();
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [applyState]);

  // Fast path: Supabase Realtime broadcast.
  useEffect(() => {
    if (!realtimeUrl || !realtimeKey) return;
    const client = createClient(realtimeUrl, realtimeKey, {
      auth: { persistSession: false },
    });
    let ch: RealtimeChannel | null = null;
    try {
      ch = client
        .channel(channel)
        .on('broadcast', { event: 'floor_state' }, (msg) => {
          applyState(msg.payload as FloorState);
        })
        .subscribe((status) => setRealtimeStatus(status.toLowerCase()));
    } catch {
      setRealtimeStatus('error');
    }
    return () => {
      if (ch) void client.removeChannel(ch);
    };
  }, [channel, realtimeUrl, realtimeKey, applyState]);

  const views: RoomView[] = useMemo(() => {
    const at = new Date(now);
    return state.rooms.map((room) => deriveRoomView(room, state.sessions[room.id] ?? null, at));
  }, [state, now]);

  const run = (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      setMessage(result.ok ? `${label}: ok` : `${label}: ${result.error ?? 'failed'}`);
      try {
        const res = await fetch('/dev/floor/api/state', { cache: 'no-store' });
        if (res.ok) applyState((await res.json()) as FloorState);
      } catch {
        /* poll will catch up */
      }
    });
  };

  const readyCount = views.filter((v) => v.state === 'ready').length;

  return (
    <main style={S.page}>
      <header style={S.topbar}>
        <div>
          <div style={S.wordmark}>Bask — floor harness</div>
          <div style={S.sub}>
            {state.salonName} · {state.rooms.length} rooms · {readyCount} ready · driver{' '}
            <code>{state.driver?.type ?? '—'}</code> v{state.driver?.apiVersion ?? '—'} ·{' '}
            {state.driver?.unitCount ?? 0} units
          </div>
        </div>
        <div style={S.clockBox}>
          <div style={S.clock}>{new Date(now).toLocaleTimeString('en-CA', { hour12: false })}</div>
          <div style={S.sub}>
            server v{state.version} · realtime <strong>{realtimeStatus}</strong> · poll {POLL_MS}ms
          </div>
        </div>
      </header>

      <section style={S.controls}>
        <button
          style={S.btn}
          disabled={pending}
          onClick={() => run('manual start', () => triggerManualStartAction())}
        >
          Simulate manual start (bed timer)
        </button>
        <button
          style={S.btn}
          disabled={pending}
          onClick={() => run('reseed', () => reseedAction())}
        >
          Re-seed test salon
        </button>
        <button
          style={S.btn}
          disabled={pending}
          onClick={() => run('reset floor', () => resetFloorAction())}
        >
          Reset floor
        </button>
        {message && <span style={S.msg}>{message}</span>}
      </section>

      <section style={S.grid}>
        {views.map((view) => (
          <RoomCard
            key={view.roomId}
            view={view}
            disabled={pending}
            onStart={(minutes, delayMinutes) =>
              run(`start ${view.name}`, () =>
                startSessionAction({ roomId: view.roomId, minutes, delayMinutes }),
              )
            }
            onCancel={() => run(`cancel ${view.name}`, () => cancelSessionAction(view.roomId))}
            onMaintenance={(on) =>
              run(`maintenance ${view.name}`, () => setMaintenanceAction(view.roomId, on))
            }
          />
        ))}
      </section>

      <section>
        <h2 style={S.h2}>Sessions (newest first)</h2>
        <p style={S.note}>
          A <code>manual_equipment</code> row is the acceptance proof: the bed was started on its
          own timer, the server observed the event and reconciled it into a real Session with no
          customer attached — the board reports what it can see and nothing more.
        </p>
        <table style={S.table}>
          <thead>
            <tr>
              {['Room', 'State', 'Started by', 'Min', 'Customer', 'Created', 'Note'].map((h) => (
                <th key={h} style={S.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.recent.length === 0 && (
              <tr>
                <td style={S.td} colSpan={7}>
                  No sessions yet — start one above, or wait for the simulator.
                </td>
              </tr>
            )}
            {state.recent.map((s) => (
              <tr
                key={s.id}
                style={s.startedBy === 'manual_equipment' ? { background: '#fff8ec' } : undefined}
              >
                <td style={S.td}>{s.roomName}</td>
                <td style={S.td}>{s.state}</td>
                <td style={S.td}>
                  <code>{s.startedBy}</code>
                </td>
                <td style={S.td}>{s.requestedMinutes}</td>
                <td style={S.td}>{s.customerName ?? '—'}</td>
                <td style={S.td}>
                  {new Date(s.createdAt).toLocaleTimeString('en-CA', { hour12: false })}
                </td>
                <td style={{ ...S.td, maxWidth: 320 }}>{s.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={S.footer}>
        State is server-authoritative. Reload this page mid-countdown — the timer resumes from the
        Session row&apos;s <code>ends_at</code>, not from anything the browser was holding. Re-seed
        after a fixtures wipe with the button above or{' '}
        <code>curl -X POST /dev/floor/api/reseed</code>.
      </footer>
    </main>
  );
}

function RoomCard({
  view,
  disabled,
  onStart,
  onCancel,
  onMaintenance,
}: {
  view: RoomView;
  disabled: boolean;
  onStart: (minutes: number, delayMinutes: number) => void;
  onCancel: () => void;
  onMaintenance: (on: boolean) => void;
}) {
  const style = STATE_STYLE[view.state] ?? STATE_STYLE.ready!;
  const showCountdown =
    view.phase === 'running' || view.phase === 'cleaning' || view.phase === 'delay';

  return (
    <article
      style={{
        ...S.card,
        borderColor: style.border,
        // The ring is the only colour-loud element on the board (DESIGN_SPEC §3.2).
        boxShadow: view.phase === 'running' ? `0 0 0 3px ${style.border}` : undefined,
      }}
    >
      <div style={S.equip}>{view.equipmentLabel.toUpperCase()}</div>
      <div style={S.roomName}>{view.name}</div>

      <div style={{ ...S.chip, background: style.bg, color: style.fg }}>
        {view.stateLabel}
        {view.phase === 'delay' && ' · delay'}
        {view.isManual && ' · manual'}
      </div>

      {showCountdown && <div style={S.countdown}>{formatCountdown(view.remainingSec)}</div>}
      {view.customerName && <div style={S.customer}>{view.customerName}</div>}
      {view.isManual && view.phase === 'running' && (
        <div style={S.manualNote}>Manual session — no check-in</div>
      )}
      {view.maintenanceNote && <div style={S.manualNote}>{view.maintenanceNote}</div>}

      <div style={S.cardActions}>
        {view.canStart && (
          <>
            <button style={S.smallBtn} disabled={disabled} onClick={() => onStart(1, 0)}>
              Start 1 min
            </button>
            <button style={S.smallBtn} disabled={disabled} onClick={() => onStart(12, 0)}>
              Start 12 min
            </button>
            <button style={S.smallBtn} disabled={disabled} onClick={() => onStart(12, 1)}>
              +1 min delay
            </button>
          </>
        )}
        {view.canCancel && (
          <button style={S.smallBtn} disabled={disabled} onClick={onCancel}>
            Cancel
          </button>
        )}
        {view.state !== 'in_session' && (
          <button
            style={S.smallBtn}
            disabled={disabled}
            onClick={() => onMaintenance(view.state !== 'maintenance')}
          >
            {view.state === 'maintenance' ? 'Back in service' : 'Maintenance'}
          </button>
        )}
      </div>
    </article>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    padding: '20px 24px 60px',
    maxWidth: 1180,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #e5e0dc',
    paddingBottom: 12,
    gap: 16,
  },
  wordmark: { fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' },
  sub: { fontSize: 12, opacity: 0.65, marginTop: 4 },
  clockBox: { textAlign: 'right' },
  clock: { fontSize: 22, fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
  controls: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  btn: {
    padding: '8px 12px',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid #d7cfc9',
    background: '#fff',
    cursor: 'pointer',
  },
  smallBtn: {
    padding: '4px 8px',
    fontSize: 11,
    borderRadius: 6,
    border: '1px solid #d7cfc9',
    background: '#fff',
    cursor: 'pointer',
  },
  msg: { fontSize: 12, fontFamily: 'ui-monospace, monospace', opacity: 0.75 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  card: {
    minHeight: 132,
    border: '1px solid #e5e0dc',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: '#fff',
  },
  equip: { fontSize: 11, letterSpacing: '0.08em', opacity: 0.55, fontWeight: 600 },
  roomName: { fontSize: 16, fontWeight: 600 },
  chip: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    marginTop: 2,
  },
  countdown: { fontSize: 31, fontVariantNumeric: 'tabular-nums', fontWeight: 600, lineHeight: 1.1 },
  customer: { fontSize: 13, opacity: 0.8 },
  manualNote: { fontSize: 11, opacity: 0.6, fontStyle: 'italic' },
  cardActions: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 8 },
  h2: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  note: { fontSize: 12, opacity: 0.7, marginBottom: 8, maxWidth: 780, lineHeight: 1.5 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid #e5e0dc',
    opacity: 0.6,
    fontWeight: 600,
  },
  td: { padding: '6px 8px', borderBottom: '1px solid #f0ecea', verticalAlign: 'top' },
  footer: {
    fontSize: 12,
    opacity: 0.6,
    lineHeight: 1.6,
    borderTop: '1px solid #e5e0dc',
    paddingTop: 12,
  },
};
