'use client';

import { useMemo, useState } from 'react';

import type { ProductOption } from '@/server/floor/floor-data';

import { FLOOR, money } from '../copy';
import type { SaleReceipt, TenderChoice } from '../actions';

/**
 * POS-lite (DESIGN_SPEC §6: "POS = compact density + ServicePill grid + cart
 * list of StatRows").
 *
 * The reason this exists at all is the loop it closes: a sale written here is a
 * real `SaleLine` bound to the checked-in customer, so retail attachment on
 * Insights moves because somebody sold a lotion, not because a number was
 * nudged. Everything else about the till is deliberately thin.
 *
 * Gift cards appear on both sides of the counter, which is the whole trick: they
 * are a *product* when sold (a liability row is created) and a *tender* when
 * redeemed (that balance is spent).
 */

export interface CartLine {
  key: string;
  productId?: string;
  giftCardAmount?: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

const GIFT_CARD_AMOUNTS = [25, 50, 100];

/**
 * Deterministic tile wash, so a product looks like itself every time a staffer
 * scans the grid for it. Since the real UVALUX photographs landed it is the
 * backdrop behind the bottle rather than the whole tile — the shots are cut-outs
 * on white and need an edge to sit on.
 *
 * Constrained to the brand's own arc — terracotta (42) through gold (85) — at
 * low chroma. The obvious version of this function spreads hue across the full
 * 360° for maximum distinguishability, and it is wrong twice: DESIGN_SPEC §2.1
 * allows exactly one accent, and a wall of arbitrary violet-and-teal squares is
 * precisely the generic "AI wash" the slop-test calls out. Forty tiles that are
 * all recognisably the same family still separate fine, because position and
 * name do most of the work.
 *
 * The sunset gradient stays reserved for the gift-card tiles — §2.1: sacred and
 * scarce, one brand moment per screen.
 */
function tileWash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = 42 + (h % 44); // terracotta → gold
  const light = 78 + ((h >>> 8) % 10); // 78–87%
  return `linear-gradient(140deg, oklch(${light}% 0.05 ${hue}), oklch(${light - 8}% 0.07 ${hue + 8}))`;
}

export function PosPanel({
  products,
  cart,
  customerName,
  busy,
  receipt,
  onAdd,
  onRemove,
  onCharge,
  onNewSale,
}: {
  products: ProductOption[];
  cart: CartLine[];
  customerName: string | null;
  busy: boolean;
  receipt: SaleReceipt | null;
  onAdd: (line: CartLine) => void;
  onRemove: (key: string) => void;
  onCharge: (input: {
    tender: TenderChoice;
    discountPct: number;
    giftCardCode?: string;
    cashTendered?: number;
  }) => void;
  onNewSale: () => void;
}) {
  const [query, setQuery] = useState('');
  const [tender, setTender] = useState<TenderChoice>('card');
  const [discountPct, setDiscountPct] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [cashTendered, setCashTendered] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [products, query]);

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discount = Math.round(((subtotal * discountPct) / 100) * 100) / 100;
  const total = Math.round((subtotal - discount) * 100) / 100;

  return (
    <>
      <section>
        <div className="floor-head">
          <h1>{FLOOR.pos.title}</h1>
        </div>
        <label className="floor-field">
          <span className="k">{FLOOR.pos.searchPlaceholder}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={FLOOR.pos.searchPlaceholder}
            autoComplete="off"
          />
        </label>

        <div className="pos-grid">
          {GIFT_CARD_AMOUNTS.map((amount) => (
            <button
              key={`gc-${amount}`}
              type="button"
              className="pos-tile"
              onClick={() =>
                onAdd({
                  key: `gc-${amount}-${Date.now()}`,
                  giftCardAmount: amount,
                  name: `${FLOOR.pos.sellGiftCard} · ${money(amount)}`,
                  unitPrice: amount,
                  quantity: 1,
                })
              }
            >
              <span className="pos-thumb" style={{ background: 'var(--grad-sunset-soft)' }}>
                ✦
              </span>
              <span className="body">
                <span className="name">{FLOOR.pos.sellGiftCard}</span>
                <span className="brand">{FLOOR.pos.giftCardAmount}</span>
              </span>
              <span className="foot">
                <span className="price num">{money(amount)}</span>
              </span>
            </button>
          ))}

          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pos-tile"
              disabled={p.onHand <= 0}
              onClick={() =>
                onAdd({
                  key: p.id,
                  productId: p.id,
                  name: p.name,
                  unitPrice: p.price,
                  quantity: 1,
                })
              }
            >
              <span
                className={`pos-thumb${p.image ? ' has-photo' : ''}`}
                style={{ background: tileWash(p.sku) }}
              >
                {p.image ? (
                  <img src={p.image} alt="" loading="lazy" decoding="async" />
                ) : (
                  p.name.charAt(0)
                )}
              </span>
              <span className="body">
                <span className="brand-line">{p.brand}</span>
                <span className="name">{p.name}</span>
                {p.size && <span className="brand">{p.size}</span>}
              </span>
              <span className="foot">
                <span className="price num">{money(p.price)}</span>
                <span className={`stock num${p.onHand <= 0 ? ' out' : ''}`}>
                  {p.onHand <= 0 ? FLOOR.pos.outOfStock : `${p.onHand} left`}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel">
        {receipt ? (
          <div className="receipt">
            <div className="tick" aria-hidden>
              ✓
            </div>
            <h3>{FLOOR.pos.receiptTitle}</h3>
            <p className="sub">{FLOOR.pos.receiptSub(money(receipt.total), receipt.tenderLabel)}</p>
            <div style={{ textAlign: 'left', margin: 'var(--space-5) 0' }}>
              {receipt.lines.map((line, i) => (
                <div className="stat-row" key={i}>
                  <span className="k">
                    {line.name}
                    {line.quantity > 1 ? ` ×${line.quantity}` : ''}
                  </span>
                  <span className="v num">{money(line.lineTotal)}</span>
                </div>
              ))}
              {receipt.changeDue > 0 && (
                <div className="stat-row">
                  <span className="k">{FLOOR.pos.changeDue(money(receipt.changeDue))}</span>
                </div>
              )}
              {receipt.giftCardsIssued.map((gc) => (
                <div className="stat-row" key={gc.code}>
                  <span className="k">{FLOOR.pos.sellGiftCard}</span>
                  <span className="v">{gc.code}</span>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-primary start" onClick={onNewSale}>
              {FLOOR.pos.newSale}
            </button>
          </div>
        ) : (
          <>
            <div className="panel-head">
              <div>
                <h2>{FLOOR.pos.cartTitle}</h2>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  {customerName ? FLOOR.pos.attachedTo(customerName) : FLOOR.pos.noCustomer}
                </span>
              </div>
            </div>
            <div className="panel-body">
              {cart.length === 0 ? (
                <div className="floor-empty" style={{ border: 0, padding: 0 }}>
                  <h3>{FLOOR.pos.cartEmptyTitle}</h3>
                  <p>{FLOOR.pos.cartEmptyBody}</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    {cart.map((line) => (
                      <div className="cart-line" key={line.key}>
                        <span className="name">{line.name}</span>
                        <span className="qty num">×{line.quantity}</span>
                        <span className="amount num">
                          {money(line.unitPrice * line.quantity)}
                        </span>
                        <button
                          type="button"
                          className="drop"
                          aria-label={FLOOR.pos.remove}
                          onClick={() => onRemove(line.key)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="sect">{FLOOR.pos.tender}</div>
                  <div className="tender-row">
                    {(
                      [
                        'card',
                        'cash',
                        'gift_card',
                        'package_credit',
                        'membership_included',
                      ] as TenderChoice[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`svc${t === tender ? ' sel' : ''}`}
                        onClick={() => setTender(t)}
                      >
                        {FLOOR.pos.tenders[t]}
                      </button>
                    ))}
                  </div>

                  {tender === 'gift_card' && (
                    <label className="floor-field">
                      <span className="k">{FLOOR.pos.giftCardCode}</span>
                      <input
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value)}
                        placeholder="GC-______"
                        autoComplete="off"
                      />
                    </label>
                  )}
                  {tender === 'cash' && (
                    <label className="floor-field">
                      <span className="k">{FLOOR.pos.cashTendered}</span>
                      <input
                        inputMode="decimal"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                  )}

                  <label className="floor-field">
                    <span className="k">
                      {FLOOR.pos.discountLabel} {discountPct}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))}
                    />
                  </label>

                  <div className="stat-row">
                    <span className="k">{FLOOR.pos.subtotal}</span>
                    <span className="v num">{money(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="stat-row">
                      <span className="k">{FLOOR.pos.discount}</span>
                      <span className="v num">−{money(discount)}</span>
                    </div>
                  )}
                  <div className="stat-row total" style={{ marginBottom: 'var(--space-5)' }}>
                    <span className="k">{FLOOR.pos.total}</span>
                    <span className="v num">{money(total)}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary start"
                    disabled={busy}
                    onClick={() =>
                      onCharge({
                        tender,
                        discountPct,
                        giftCardCode: giftCardCode || undefined,
                        cashTendered: cashTendered ? Number(cashTendered) : undefined,
                      })
                    }
                  >
                    {FLOOR.pos.charge(money(total), FLOOR.pos.tenders[tender])}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
