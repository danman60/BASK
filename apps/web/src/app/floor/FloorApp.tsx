'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { deriveRoomView, type RoomView } from '@bask/core/sessions';

import type {
  CustomerCard,
  FloorCatalogue,
  HandoffSummary,
  ScheduleBooking,
} from '@/server/floor/floor-data';
import type { FloorState } from '@/server/floor/state';

import {
  cancelSessionAction,
  checkInAction,
  completeSaleAction,
  loadCustomerCardAction,
  postHandoffAction,
  quickCreateProductAction,
  readHandoffAction,
  rebookAction,
  receiveScanAction,
  recordWaiverAction,
  setMaintenanceAction,
  type SaleReceipt,
  type TenderChoice,
} from './actions';
import { CheckInPanel, CustomerSearch } from './components/CheckInPanel';
import { HandoffSheet } from './components/HandoffSheet';
import { PosPanel, type CartLine } from './components/PosPanel';
import { QuickCreateSheet } from './components/QuickCreateSheet';
import { RoomBoard } from './components/RoomBoard';
import { SchedulePanel } from './components/SchedulePanel';
import { WaiverSheet } from './components/WaiverSheet';
import { FLOOR, floorError, money } from './copy';
import { guessSymbology, useWedgeScanner } from './lib/use-wedge-scanner';

/**
 * The Floor shell.
 *
 * Trust order for room state is the M0 harness's, unchanged because it was
 * right: server-rendered `initialState` (authoritative at load) → Supabase
 * Realtime broadcast (fast) → a 2s poll (correct, and the recovery path). Stale
 * pushes are dropped by `version`, so ordering between the last two cannot
 * matter.
 *
 * The wedge listener lives here rather than in the POS tab, because §6.2 is
 * explicit that a scan works *anywhere on the Floor*. What a scan does is routed
 * by what is open — cart, receiving, or a price lookup — which is the only piece
 * of context a staffer holds in their head.
 */

const POLL_MS = 2000;
const TICK_MS = 250;
const TOAST_MS = 4200;

type Tab = 'board' | 'checkin' | 'pos' | 'schedule';

interface Toast {
  id: number;
  text: string;
  tone?: 'quiet' | 'warn' | 'risk';
  action?: { label: string; run: () => void };
}

export function FloorApp({
  initialState,
  catalogue,
  bookings: initialBookings,
  handoff: initialHandoff,
  today,
  zone,
  channel,
  realtimeUrl,
  realtimeKey,
}: {
  initialState: FloorState;
  catalogue: FloorCatalogue;
  bookings: ScheduleBooking[];
  handoff: HandoffSummary;
  today: string;
  zone: string;
  channel: string;
  realtimeUrl: string | null;
  realtimeKey: string | null;
}) {
  const [tab, setTab] = useState<Tab>('board');
  const [state, setState] = useState<FloorState>(initialState);
  const [bookings, setBookings] = useState(initialBookings);
  const [handoff, setHandoff] = useState(initialHandoff);
  const [busy, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [card, setCard] = useState<CustomerCard | null>(null);
  /**
   * Who the till is selling to.
   *
   * Separate from `card` on purpose. DESIGN_SPEC §3.2 says the check-in panel
   * clears when a session starts — the desk is immediately ready for the next
   * person, which is the actual rhythm of a front desk. But the customer who
   * just walked to a bed is exactly the one about to buy a lotion on the way
   * out, and losing the attachment there is how retail stops showing up on
   * anybody's record. So the panel clears and the till remembers.
   */
  const [posCustomer, setPosCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [waiverOpen, setWaiverOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);

  // --- clock ---------------------------------------------------------------
  // Starts on the server's instant so the first client render matches the HTML,
  // then advances locally and re-anchors on every payload.
  const [now, setNow] = useState(() => new Date(initialState.serverNow).getTime());
  const anchor = useRef({ serverMs: new Date(initialState.serverNow).getTime(), localMs: 0 });

  const applyState = useCallback((next: FloorState) => {
    setState((prev) => (next.version < prev.version ? prev : next));
    anchor.current = { serverMs: new Date(next.serverNow).getTime(), localMs: Date.now() };
  }, []);

  useEffect(() => {
    anchor.current.localMs = Date.now();
    const id = setInterval(() => {
      const { serverMs, localMs } = anchor.current;
      setNow(localMs === 0 ? serverMs : serverMs + (Date.now() - localMs));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/floor/api/state', { cache: 'no-store' });
        if (!res.ok || !alive) return;
        applyState((await res.json()) as FloorState);
      } catch {
        // Offline for a beat; the next poll recovers.
      }
    };
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [applyState]);

  useEffect(() => {
    if (!realtimeUrl || !realtimeKey) return;
    const client = createClient(realtimeUrl, realtimeKey, { auth: { persistSession: false } });
    let ch: RealtimeChannel | null = null;
    try {
      ch = client
        .channel(channel)
        .on('broadcast', { event: 'floor_state' }, (msg) => applyState(msg.payload as FloorState))
        .subscribe();
    } catch {
      // Polling covers it.
    }
    return () => {
      if (ch) void client.removeChannel(ch);
    };
  }, [channel, realtimeUrl, realtimeKey, applyState]);

  const views: RoomView[] = useMemo(() => {
    const at = new Date(now);
    return state.rooms.map((room) => deriveRoomView(room, state.sessions[room.id] ?? null, at));
  }, [state, now]);

  // --- toasts --------------------------------------------------------------

  const toast = useCallback((text: string, tone?: Toast['tone'], action?: Toast['action']) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, tone, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_MS);
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/floor/api/state', { cache: 'no-store' });
      if (res.ok) applyState((await res.json()) as FloorState);
    } catch {
      /* the poll will catch up */
    }
  }, [applyState]);

  // --- scanning ------------------------------------------------------------

  const productById = useMemo(
    () => new Map(catalogue.products.map((p) => [p.id, p])),
    [catalogue.products],
  );

  const addToCart = useCallback(
    (productId: string) => {
      const product = productById.get(productId);
      if (!product) return;
      setReceipt(null);
      setCart((prev) => {
        const found = prev.find((l) => l.key === product.id);
        if (found) {
          return prev.map((l) => (l.key === product.id ? { ...l, quantity: l.quantity + 1 } : l));
        }
        return [
          ...prev,
          {
            key: product.id,
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity: 1,
          },
        ];
      });
      toast(FLOOR.scanner.addedToCart(product.name));
    },
    [productById, toast],
  );

  const [barcodeIndex, setBarcodeIndex] = useState(catalogue.barcodeIndex);

  const onScan = useCallback(
    ({ value }: { value: string }) => {
      const productId = barcodeIndex[value];
      if (!productId) {
        setPendingBarcode(value);
        toast(FLOOR.scanner.unknown, 'warn');
        return;
      }
      if (receiving) {
        startTransition(async () => {
          const result = await receiveScanAction(productId);
          const product = productById.get(productId);
          if (result.ok && product) toast(FLOOR.scanner.received(product.name, result.onHand));
        });
        return;
      }
      if (tab === 'pos') {
        addToCart(productId);
        return;
      }
      const product = productById.get(productId);
      if (product) toast(FLOOR.scanner.lookup(product.name, money(product.price)));
    },
    [addToCart, barcodeIndex, productById, receiving, tab, toast],
  );

  const { listening } = useWedgeScanner(onScan);

  // --- check-in ------------------------------------------------------------

  const pickCustomer = useCallback((customerId: string) => {
    startTransition(async () => {
      const result = await loadCustomerCardAction(customerId);
      if (result.ok) {
        setCard(result.card);
        setVisitId(null);
        setPosCustomer({
          id: result.card.id,
          name: `${result.card.firstName} ${result.card.lastName}`,
        });
      }
    });
  }, []);

  const startSession = (input: { serviceId: string; roomId: string; minutes: number }) => {
    if (!card) return;
    const room = views.find((v) => v.roomId === input.roomId);
    startTransition(async () => {
      const result = await checkInAction({ ...input, customerId: card.id });
      if (!result.ok) {
        toast(floorError(result.error), 'risk');
        // A refusal usually means the board was a poll behind reality — somebody
        // else took the room. Re-read immediately so the next attempt is offered
        // an honest list of free rooms.
        await refreshState();
        return;
      }
      setVisitId(result.visitId ?? null);
      setPosCustomer({ id: card.id, name: `${card.firstName} ${card.lastName}` });
      setCard(null);
      toast(FLOOR.checkin.started(card.firstName, room?.name ?? ''));
      await refreshState();
    });
  };

  const saveWaiver = (input: {
    imageData: string;
    width: number;
    height: number;
    strokes: number;
    signedName: string;
  }) => {
    if (!card) return;
    startTransition(async () => {
      const result = await recordWaiverAction({ customerId: card.id, ...input });
      if (!result.ok) {
        toast(floorError(result.error), 'risk');
        return;
      }
      toast(FLOOR.waiver.saved);
      setWaiverOpen(false);
      const refreshed = await loadCustomerCardAction(card.id);
      if (refreshed.ok) setCard(refreshed.card);
    });
  };

  // --- POS -----------------------------------------------------------------

  const charge = (input: {
    tender: TenderChoice;
    discountPct: number;
    giftCardCode?: string;
    cashTendered?: number;
  }) => {
    startTransition(async () => {
      const result = await completeSaleAction({
        customerId: posCustomer?.id ?? null,
        visitId,
        lines: cart.map((l) => ({
          productId: l.productId,
          giftCardAmount: l.giftCardAmount,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        ...input,
      });
      if (!result.ok) {
        toast(floorError(result.error), 'risk');
        return;
      }
      setReceipt(result.receipt);
      setCart([]);
    });
  };

  const createProduct = (input: Parameters<typeof quickCreateProductAction>[0]) => {
    startTransition(async () => {
      const result = await quickCreateProductAction(input);
      if (!result.ok) {
        toast(floorError(result.error), 'risk');
        return;
      }
      setBarcodeIndex((prev) => ({ ...prev, [input.barcode]: result.productId }));
      // The new product is not in `catalogue.products` until the page reloads,
      // so put it in the cart directly rather than pretending a lookup worked.
      setCart((prev) => [
        ...prev,
        {
          key: result.productId,
          productId: result.productId,
          name: input.name,
          unitPrice: input.price,
          quantity: 1,
        },
      ]);
      setPendingBarcode(null);
      setTab('pos');
      toast(FLOOR.quickCreate.saved(input.name, result.sku));
    });
  };

  // --- schedule ------------------------------------------------------------

  const rebook = (bookingId: string, startsAt: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const previous = booking?.startsAt;
    // Optimistic: the Floor never waits on a write to redraw (§5.2 latency rule).
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              startsAt,
              endsAt: new Date(new Date(startsAt).getTime() + b.minutes * 60_000).toISOString(),
            }
          : b,
      ),
    );
    startTransition(async () => {
      const result = await rebookAction({ bookingId, startsAt });
      if (!result.ok) {
        if (previous) {
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, startsAt: previous } : b)),
          );
        }
        toast(floorError(result.error), 'risk');
        return;
      }
      if (booking) {
        toast(
          FLOOR.schedule.moved(
            booking.who,
            new Date(startsAt).toLocaleTimeString('en-CA', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: zone,
            }),
          ),
        );
      }
    });
  };

  // --- handoff -------------------------------------------------------------

  const postHandoff = (note: string) => {
    startTransition(async () => {
      const result = await postHandoffAction({ note, summary: handoff });
      if (!result.ok) {
        toast(floorError(result.error), 'risk');
        return;
      }
      setHandoff((prev) => ({
        ...prev,
        posted: { note, postedAt: new Date().toISOString() },
      }));
      setHandoffOpen(false);
      toast(FLOOR.handoff.postedToast);
    });
  };

  // --- render --------------------------------------------------------------

  const scanMode = receiving
    ? FLOOR.scanner.modes.receiving
    : tab === 'pos'
      ? FLOOR.scanner.modes.pos
      : FLOOR.scanner.modes.lookup;

  return (
    <div className="floor">
      <header className="floor-topbar">
        <span className="floor-wordmark">Bask</span>
        <nav className="floor-tabs" aria-label={FLOOR.title}>
          {(['board', 'checkin', 'pos', 'schedule'] as Tab[]).map((t) => (
            <a
              key={t}
              href={`#${t}`}
              aria-current={tab === t ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setTab(t);
              }}
            >
              {FLOOR.tabs[t]}
            </a>
          ))}
        </nav>

        <span className="floor-scan-hint" data-live={listening} title={`${FLOOR.scanner.modeLabel}: ${scanMode}`}>
          {listening ? FLOOR.scanner.listening : FLOOR.scanner.ready}
          <span className="pill" aria-hidden>
            ⌁
          </span>
        </span>
        <button
          type="button"
          className={`btn ${receiving ? 'btn-primary' : 'btn-quiet'} floor-topbar-action`}
          onClick={() => setReceiving((v) => !v)}
          title={`${FLOOR.scanner.modeLabel}: ${FLOOR.scanner.modes.receiving}`}
        >
          {FLOOR.scanner.receivingToggle}
        </button>
        <button
          type="button"
          className="btn btn-quiet floor-topbar-action"
          onClick={() => {
            setHandoffOpen(true);
            // Recompute on open — a sale made a minute ago belongs in the total.
            startTransition(async () => setHandoff(await readHandoffAction()));
          }}
        >
          {FLOOR.handoff.open}
        </button>
        <span className="floor-clock num">
          {new Date(now).toLocaleTimeString('en-CA', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: zone,
          })}
        </span>
      </header>

      {tab === 'board' && (
        <div className="floor-layout">
          <section>
            <div className="floor-head">
              <h1>{FLOOR.title}</h1>
              <div className="floor-legend">
                <span>
                  <i style={{ background: 'var(--success)' }} />
                  {FLOOR.legend.ready}
                </span>
                <span>
                  <i style={{ background: 'var(--primary)' }} />
                  {FLOOR.legend.inSession}
                </span>
                <span>
                  <i style={{ background: 'var(--warn)' }} />
                  {FLOOR.legend.cleaning}
                </span>
                <span>
                  <i style={{ background: 'var(--risk)' }} />
                  {FLOOR.legend.maintenance}
                </span>
              </div>
            </div>
            <RoomBoard
              views={views}
              busy={busy}
              onCancel={(roomId) =>
                startTransition(async () => {
                  const result = await cancelSessionAction(roomId);
                  if (!result.ok) toast(floorError(result.error), 'risk');
                  await refreshState();
                })
              }
              onMaintenance={(roomId, on) =>
                startTransition(async () => {
                  const result = await setMaintenanceAction(roomId, on);
                  if (!result.ok) toast(floorError(result.error), 'risk');
                  await refreshState();
                })
              }
            />
          </section>

          <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <CustomerSearch customers={catalogue.customers} onPick={(c) => pickCustomer(c.id)} />
            </div>
            <CheckInPanel
              card={card}
              services={catalogue.services}
              rooms={views}
              busy={busy}
              onStart={startSession}
              onOpenWaiver={() => setWaiverOpen(true)}
              onSellUpsell={(productId) => {
                addToCart(productId);
                setTab('pos');
              }}
            />
          </div>
        </div>
      )}

      {tab === 'checkin' && (
        <div className="floor-layout">
          <section>
            <div className="floor-head">
              <h1>{FLOOR.tabs.checkin}</h1>
            </div>
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <CustomerSearch
                customers={catalogue.customers}
                onPick={(c) => pickCustomer(c.id)}
                autoFocus
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: 8 }}>
                {FLOOR.checkin.searchHint}
              </p>
            </div>

            <div className="floor-head" style={{ marginTop: 'var(--space-6)' }}>
              <h1 style={{ fontSize: 'var(--text-lg)' }}>{FLOOR.checkin.arrivingTitle}</h1>
            </div>
            <ArrivingSoon bookings={bookings} zone={zone} onPick={pickCustomer} />
          </section>

          <CheckInPanel
            card={card}
            services={catalogue.services}
            rooms={views}
            busy={busy}
            onStart={startSession}
            onOpenWaiver={() => setWaiverOpen(true)}
            onSellUpsell={(productId) => {
              addToCart(productId);
              setTab('pos');
            }}
          />
        </div>
      )}

      {tab === 'pos' && (
        <div className="floor-layout">
          <PosPanel
            products={catalogue.products}
            cart={cart}
            customerName={posCustomer?.name ?? null}
            busy={busy}
            receipt={receipt}
            onAdd={(line) => {
              setReceipt(null);
              setCart((prev) => {
                const found = prev.find((l) => l.key === line.key);
                if (found) {
                  return prev.map((l) =>
                    l.key === line.key ? { ...l, quantity: l.quantity + 1 } : l,
                  );
                }
                return [...prev, line];
              });
            }}
            onRemove={(key) => setCart((prev) => prev.filter((l) => l.key !== key))}
            onCharge={charge}
            onNewSale={() => setReceipt(null)}
          />
        </div>
      )}

      {tab === 'schedule' && (
        <div className="floor-layout is-single">
          <SchedulePanel
            bookings={bookings}
            today={today}
            zone={zone}
            roomCount={state.rooms.length}
            busy={busy}
            onRebook={rebook}
          />
        </div>
      )}

      {waiverOpen && card && (
        <WaiverSheet
          customerId={card.id}
          customerName={`${card.firstName} ${card.lastName}`}
          busy={busy}
          onClose={() => setWaiverOpen(false)}
          onSave={saveWaiver}
        />
      )}

      {handoffOpen && (
        <HandoffSheet
          summary={handoff}
          busy={busy}
          onClose={() => setHandoffOpen(false)}
          onPost={postHandoff}
        />
      )}

      {pendingBarcode && (
        <QuickCreateSheet
          barcode={pendingBarcode}
          symbology={guessSymbology(pendingBarcode)}
          busy={busy}
          onClose={() => setPendingBarcode(null)}
          onCreate={createProduct}
        />
      )}

      <div className="floor-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className="floor-toast" key={t.id} data-tone={t.tone}>
            {t.text}
            {t.action && (
              <button type="button" onClick={t.action.run}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrivingSoon({
  bookings,
  zone,
  onPick,
}: {
  bookings: ScheduleBooking[];
  zone: string;
  onPick: (customerId: string) => void;
}) {
  const soon = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => {
        const at = new Date(b.startsAt).getTime();
        return b.state === 'booked' && at > now - 30 * 60_000 && at < now + 120 * 60_000;
      })
      .slice(0, 8);
  }, [bookings]);

  if (soon.length === 0) {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
        {FLOOR.checkin.arrivingEmpty}
      </p>
    );
  }

  return (
    <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
      {soon.map((b) => (
        <div className="stat-row" key={b.id}>
          <span className="k num">
            {new Date(b.startsAt).toLocaleTimeString('en-CA', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: zone,
            })}
          </span>
          <span className="v" style={{ fontWeight: 600, marginRight: 'auto', marginLeft: 12 }}>
            {b.who}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
            {b.serviceName}
          </span>
          {b.customerId && (
            <button
              type="button"
              className="btn btn-quiet"
              style={{ padding: '5px 12px', marginLeft: 12 }}
              onClick={() => onPick(b.customerId!)}
            >
              {FLOOR.checkin.checkInBooked}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
