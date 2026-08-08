import Link from 'next/link';
import { formatCurrency, formatLongDate, round } from '@bask/core';
import { Guided, TeachingEmptyState, WhisperNote } from '@bask/ui';

import '@/components/lane4/lane4.css';
import { Chip, ProductSwatch, SectionHead } from '@/components/lane4/primitives';
import {
  getLastSubmittedOrder,
  getOpenDraftOrder,
  loadInventoryBoard,
} from '@/server/inventory';
import { loadSalonFacts } from '@/server/facts';
import { getDemoSalon } from '@/server/salon';

import { addAllRecommendedAction, submitOrderAction, updateLineAction } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * The UVALUX order review screen.
 *
 * PRODUCT_SPEC §12 asks for something that reads like a real wholesale order —
 * catalogue tiles, SKUs, wholesale pricing, a total — with the difference that
 * every line still carries the reason it is there. That combination is the beat:
 * a purchase order that can explain itself.
 */
export default async function DraftOrderPage() {
  const salon = await getDemoSalon();
  const [draft, lastSubmitted] = await Promise.all([
    getOpenDraftOrder(salon.salonId),
    getLastSubmittedOrder(salon.salonId),
  ]);

  const facts = await loadSalonFacts(salon);
  const board = await loadInventoryBoard(facts);
  const notYetAdded = board.recommendations.filter(
    (rec) => !draft?.lines.some((line) => line.productId === rec.productId),
  );

  const margin =
    draft && draft.total > 0 ? round(((draft.retailValue - draft.total) / draft.total) * 100, 0) : 0;

  return (
    <main className="l4">
      <header className="l4-head">
        <div>
          <p className="eyebrow">UVALUX order · {formatLongDate(salon.today)}</p>
          <h1 className="l4-title">
            {draft && draft.lines.length > 0 ? (
              <>
                <em>
                  {draft.lines.length} {draft.lines.length === 1 ? 'line' : 'lines'}
                </em>
                , and each one says why.
              </>
            ) : (
              <>
                Your <em>UVALUX order</em> is empty.
              </>
            )}
          </h1>
          <p className="l4-sub">
            Sunset Ridge Tanning &amp; Wellness · Account with UVALUX Canada · Prices are your
            wholesale cost, shelf price shown beside them.
          </p>
        </div>
        <div className="l4-actions">
          <Link className="btn btn-quiet" href="/inventory">
            Back to the shelf
          </Link>
        </div>
      </header>

      {lastSubmitted && (
        <div className="l4-banner">
          <div className="l4-banner-body">
            <p style={{ fontWeight: 600 }}>
              Your last order went to your UVALUX rep
              {lastSubmitted.submittedAt
                ? ` on ${lastSubmitted.submittedAt.toLocaleDateString('en-CA')}`
                : ''}
              .
            </p>
            <p className="l4-note">
              {lastSubmitted.lines.length}{' '}
              {lastSubmitted.lines.length === 1 ? 'line' : 'lines'} ·{' '}
              {lastSubmitted.formattedTotal} · it is on your account timeline in UVALUX Compass,
              reasons and all.
            </p>
          </div>
        </div>
      )}

      {!draft || draft.lines.length === 0 ? (
        <div className="l4-card">
          <TeachingEmptyState state="draftOrder" />
          {notYetAdded.length > 0 && (
            <form action={addAllRecommendedAction} style={{ textAlign: 'center' }}>
              <button type="submit" className="btn btn-primary">
                Add the {notYetAdded.length} products Bask suggests
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="l4-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
          <div>
            <div className="l4-stock">
              {draft.lines.map((line) => (
                <div key={line.id} className="l4-order-line">
                  <ProductSwatch
                    sku={line.sku}
                    category={line.category}
                    image={line.image}
                    name={line.name}
                    size="lg"
                  />
                  <div>
                    <p className="l4-stock-name">{line.name}</p>
                    <p className="l4-stock-meta">
                      {line.brand ?? '—'} · {line.sku}
                      {line.size ? ` · ${line.size}` : ''}
                    </p>
                  </div>
                  {line.reason && (
                    <p className="l4-because l4-order-because">
                      <b>Why this is here.</b> {line.reason}
                    </p>
                  )}
                  <form action={updateLineAction} className="l4-actions">
                    <input type="hidden" name="lineId" value={line.id} />
                    <input
                      name="quantity"
                      type="number"
                      min={0}
                      defaultValue={line.quantity}
                      aria-label={`How many ${line.name}`}
                      style={{
                        width: 72,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--line)',
                        background: 'var(--paper-2)',
                        fontVariantNumeric: 'tabular-nums',
                        font: '600 var(--text-sm)/1.2 var(--font-body)',
                        color: 'var(--ink)',
                      }}
                    />
                    <button type="submit" className="btn btn-ghost">
                      Update
                    </button>
                  </form>
                  <div>
                    <p className="l4-big num">{formatCurrency(line.unitPrice)}</p>
                    <p className="l4-workings">
                      <Guided tip="wholesalePrice">your cost</Guided> · sells at{' '}
                      {formatCurrency(line.retailPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="l4-big num">{formatCurrency(line.lineTotal)}</p>
                    <p className="l4-workings">
                      {line.quantity} × {formatCurrency(line.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {notYetAdded.length > 0 && (
              <section className="l4-section">
                <SectionHead
                  title="Bask also suggests"
                  note="These have not been added yet. Each one carries its reason the same way."
                />
                <div className="l4-card">
                  {notYetAdded.slice(0, 4).map((rec) => (
                    <div key={rec.productId} className="l4-stat-row">
                      <span>
                        <span style={{ fontWeight: 600 }}>{rec.name}</span>
                        <span className="l4-stock-meta"> · {rec.reason}</span>
                      </span>
                      <span className="l4-stat-value num">{rec.quantity}</span>
                    </div>
                  ))}
                  <form action={addAllRecommendedAction} style={{ marginTop: 14 }}>
                    <button type="submit" className="btn btn-quiet">
                      Add all {notYetAdded.length}
                    </button>
                  </form>
                </div>
              </section>
            )}
          </div>

          <aside>
            <div className="l4-card">
              <p className="eyebrow">Order summary</p>
              <div style={{ marginTop: 14 }}>
                <div className="l4-total-row">
                  <span className="l4-stat-label">Lines</span>
                  <span className="l4-stat-value num">{draft.lines.length}</span>
                </div>
                <div className="l4-total-row">
                  <span className="l4-stat-label">Units</span>
                  <span className="l4-stat-value num">
                    {draft.lines.reduce((sum, line) => sum + line.quantity, 0)}
                  </span>
                </div>
                <div className="l4-total-row">
                  <span className="l4-stat-label">Your cost</span>
                  <strong className="num">{draft.formattedTotal}</strong>
                </div>
                <div className="l4-total-row">
                  <span className="l4-stat-label">Sells for</span>
                  <span className="l4-stat-value num">{formatCurrency(draft.retailValue)}</span>
                </div>
              </div>
              <p className="l4-workings" style={{ marginTop: 10 }}>
                If every unit sells at your shelf price, this order returns about{' '}
                {formatCurrency(draft.retailValue - draft.total)} on top of what it costs — a{' '}
                <span className="num">{margin}%</span> mark-up.
              </p>

              <form action={submitOrderAction} style={{ marginTop: 18 }}>
                <input type="hidden" name="orderId" value={draft.id} />
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Anything your rep should know (optional)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    background: 'var(--paper-2)',
                    font: '400 var(--text-sm)/1.5 var(--font-body)',
                    color: 'var(--ink)',
                    resize: 'vertical',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                >
                  Send to your UVALUX rep — {draft.formattedTotal}
                </button>
              </form>
              <WhisperNote note="orderGoesToRep" count={draft.lines.length} />
              <WhisperNote note="orderNotSentYet" />

              <div style={{ marginTop: 16 }}>
                <Chip tone="neutral">Reasons travel with the order</Chip>
                <p className="l4-workings" style={{ marginTop: 8 }}>
                  Your rep sees the same &quot;why this is here&quot; line you do, so the call
                  starts from your shelf rather than from a catalogue.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
