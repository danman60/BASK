import Link from 'next/link';
import { formatCurrency, formatLongDate, safeParseEvidence } from '@bask/core';
import { db } from '@bask/db';
import { Guided, TeachingEmptyState, WhisperNote } from '@bask/ui';

import '@/components/lane4/lane4.css';
import { Chip, ProductSwatch, SectionHead, StatRow } from '@/components/lane4/primitives';
import { ScanReceiving } from '@/components/lane4/ScanReceiving';
import { loadSalonFacts } from '@/server/facts';
import { getOpenDraftOrder, loadInventoryBoard, type StockFlag } from '@/server/inventory';
import { getDemoSalon } from '@/server/salon';

import { addAllRecommendedAction, addLineAction } from './actions';

export const dynamic = 'force-dynamic';

const FLAG_LABELS: Record<StockFlag, string> = {
  critical: 'Running out',
  reorder: 'Order now',
  watch: 'Watch',
  healthy: 'Fine',
  overstock: 'Sitting too long',
};

const REASON_LABELS = {
  below_threshold: 'Below threshold',
  sell_through_pace: 'Sell-through pace',
  seasonal_lift: 'Getting busier',
} as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; insightId?: string }>;
}) {
  const params = await searchParams;
  const salon = await getDemoSalon();
  const facts = await loadSalonFacts(salon);
  const [board, draft] = await Promise.all([
    loadInventoryBoard(facts),
    getOpenDraftOrder(salon.salonId),
  ]);

  // Insight → action provenance stays visible (DESIGN_SPEC §3.3): an owner who
  // arrived from a card should never have to remember which card it was.
  const sourceInsight =
    params.from === 'insight' && params.insightId
      ? await db.insight.findUnique({ where: { id: params.insightId } })
      : null;
  const sourceEvidence = sourceInsight ? safeParseEvidence(sourceInsight.evidence) : null;

  const needsDecision = board.counts.critical + board.counts.reorder;
  const overstocked = board.rows.filter((row) => row.flag === 'overstock');
  const inDraft = new Set(draft?.lines.map((line) => line.productId) ?? []);

  return (
    <main className="l4">
      <header className="l4-head">
        <div>
          <p className="eyebrow">Inventory · {formatLongDate(salon.today)}</p>
          <h1 className="l4-title">
            {board.recommendations.length > 0 ? (
              <>
                <em>
                  {board.recommendations.length}{' '}
                  {board.recommendations.length === 1 ? 'product' : 'products'}
                </em>{' '}
                want a decision this week.
              </>
            ) : (
              <>
                Nothing is <em>running short</em> this week.
              </>
            )}
          </h1>
          <p className="l4-sub">
            Days left are counted from what actually sold — 30 days of till lines and back-bar
            use, divided into what is on the shelf. Nothing here is a label somebody typed in.
          </p>
        </div>
        <div className="l4-actions">
          <Link className="btn btn-quiet" href="/insights">
            Insights
          </Link>
          <Link className="btn btn-primary" href="/inventory/order">
            {draft && draft.lines.length > 0
              ? `Review order — ${draft.lines.length} ${draft.lines.length === 1 ? 'line' : 'lines'} · ${draft.formattedTotal}`
              : 'Start a UVALUX order'}
          </Link>
        </div>
      </header>

      {sourceInsight && (
        <div className="l4-banner">
          <div className="l4-banner-body">
            <p style={{ fontWeight: 600 }}>Sorting out: {sourceInsight.title.toLowerCase()}.</p>
            <p className="l4-note">
              {sourceEvidence
                ? sourceEvidence.sentence.replace(/\*\*/g, '')
                : (sourceInsight.summary ?? '')}
            </p>
          </div>
        </div>
      )}

      <div className="l4-grid l4-grid-3">
        <div className="l4-card">
          <p className="l4-stat-label">Needs ordering</p>
          <p className="l4-title num" style={{ fontSize: 'var(--text-2xl)' }}>
            {needsDecision}
          </p>
          <p className="l4-workings">
            {board.counts.critical} running out · {board.counts.reorder} below their reorder point
          </p>
        </div>
        <div className="l4-card">
          <p className="l4-stat-label">
            <Guided tip="overstockFlag">Sitting too long</Guided>
          </p>
          <p className="l4-title num" style={{ fontSize: 'var(--text-2xl)' }}>
            {board.counts.overstock}
          </p>
          <p className="l4-workings">
            {formatCurrency(overstocked.reduce((sum, row) => sum + row.shelfValue, 0))} of shelf
            value moving slower than four months of selling
          </p>
        </div>
        <div className="l4-card">
          <p className="l4-stat-label">Retail on the shelf</p>
          <p className="l4-title num" style={{ fontSize: 'var(--text-2xl)' }}>
            {formatCurrency(board.shelfValueTotal)}
          </p>
          <p className="l4-workings">
            {board.rows.length} products counted at shelf price across {facts.capacity.roomCount}{' '}
            rooms
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ what to reorder */}
      <section className="l4-section">
        <SectionHead
          title="What to reorder"
          note="Every line says what put it there. Nothing goes to UVALUX until you send the order."
          aside={
            board.recommendations.length > 0 ? (
              <form action={addAllRecommendedAction}>
                <button type="submit" className="btn btn-primary">
                  Add all {board.recommendations.length} to the order
                </button>
              </form>
            ) : undefined
          }
        />

        {board.recommendations.length === 0 ? (
          <div className="l4-card">
            <TeachingEmptyState state="draftOrder" />
          </div>
        ) : (
          <div className="l4-stock">
            {board.recommendations.map((rec) => (
              <div key={rec.productId} className="l4-stock-row" data-flag="reorder">
                <ProductSwatch sku={rec.sku} category={rec.category} />
                <div>
                  <p className="l4-stock-name">{rec.name}</p>
                  <p className="l4-stock-meta">
                    {rec.sku} · {rec.brand ?? '—'} · {rec.size ?? '—'}
                  </p>
                  <p className="l4-because">
                    <b>{REASON_LABELS[rec.reasonKind]}.</b> {rec.reason}
                  </p>
                </div>
                <div>
                  <p className="l4-big num">{rec.onHand}</p>
                  <p className="l4-workings">on the shelf</p>
                </div>
                <div>
                  <p className="l4-big num">
                    {rec.daysRemaining === null ? '—' : Math.round(rec.daysRemaining)}
                  </p>
                  <p className="l4-workings">days left</p>
                </div>
                <div>
                  <p className="l4-big num">{rec.quantity}</p>
                  <p className="l4-workings">
                    suggested · {formatCurrency(rec.unitPrice)} each
                  </p>
                </div>
                <div className="l4-actions">
                  {inDraft.has(rec.productId) ? (
                    <Chip tone="healthy" dot>
                      On the order
                    </Chip>
                  ) : (
                    <form action={addLineAction}>
                      <input type="hidden" name="productId" value={rec.productId} />
                      <input type="hidden" name="quantity" value={rec.quantity} />
                      <input type="hidden" name="unitPrice" value={rec.unitPrice} />
                      <input type="hidden" name="reason" value={rec.reason} />
                      <button type="submit" className="btn btn-quiet">
                        Add {rec.quantity} to the order
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------- overstock → Studio */}
      {overstocked.length > 0 && (
        <section className="l4-section">
          <SectionHead
            title="Sitting too long"
            note="More than four months of selling on the shelf. A retail spotlight usually moves it faster than a discount does."
          />
          <div className="l4-grid l4-grid-2">
            {overstocked.slice(0, 4).map((row) => (
              <div key={row.productId} className="l4-card">
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <ProductSwatch sku={row.sku} category={row.category} size="lg" />
                  <div style={{ flex: 1 }}>
                    <p className="l4-stock-name">{row.name}</p>
                    <p className="l4-stock-meta">
                      {row.sku} · {row.onHand} on the shelf ·{' '}
                      {formatCurrency(row.shelfValue)} of shelf value
                    </p>
                    <p className="l4-workings" style={{ marginTop: 8 }}>
                      {row.workings}
                    </p>
                  </div>
                </div>
                <div className="l4-actions" style={{ marginTop: 16 }}>
                  <Link
                    className="btn btn-primary"
                    href={`/marketing?goal=retail_spotlight&productId=${row.productId}&sku=${row.sku}&from=inventory`}
                  >
                    Create a retail spotlight
                  </Link>
                  <Chip tone="overstock">
                    {row.daysSinceLastSale === null
                      ? 'Never sold'
                      : `Last sold ${row.daysSinceLastSale} days ago`}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ full list */}
      <section className="l4-section">
        <SectionHead
          title="Everything on the shelf"
          note={
            <>
              <Guided metric="stockCover">Days of stock left</Guided> is what is on the shelf
              divided by how fast it has been selling.
            </>
          }
        />
        <div className="l4-stock">
          <div className="l4-stock-row l4-stock-head">
            <span />
            <span>Product</span>
            <span>On shelf</span>
            <span>Days left</span>
            <span>Selling</span>
            <span>State</span>
          </div>
          {board.rows.map((row) => (
            <div key={row.productId} className="l4-stock-row" data-flag={row.flag}>
              <ProductSwatch sku={row.sku} category={row.category} />
              <div>
                <p className="l4-stock-name">{row.name}</p>
                <p className="l4-stock-meta">
                  {row.sku} · {row.brand ?? '—'} · {row.size ?? '—'}
                </p>
              </div>
              <div>
                <p className="l4-big num">{row.onHand}</p>
                <p className="l4-workings">
                  <Guided tip="reorderPoint">reorder at {row.reorderPoint}</Guided>
                </p>
              </div>
              <div>
                <p className="l4-big num">
                  {row.daysRemaining === null ? '—' : Math.round(row.daysRemaining)}
                </p>
                <p className="l4-workings">{row.coverSentence}</p>
              </div>
              <div>
                <p className="l4-big num">{row.dailyVelocity.toFixed(2)}</p>
                <p className="l4-workings">a day · {row.unitsSoldInWindow} in 30 days</p>
              </div>
              <div>
                <Chip tone={row.flag} dot={row.flag === 'critical' || row.flag === 'reorder'}>
                  {FLAG_LABELS[row.flag]}
                </Chip>
                <p className="l4-workings" style={{ marginTop: 6 }}>
                  {row.workings}
                </p>
              </div>
            </div>
          ))}
        </div>
        <WhisperNote note="figuresFromYourTill" />
      </section>

      {/* ------------------------------------------------------ receiving */}
      <section className="l4-section">
        <SectionHead
          title="Receiving"
          note="Scan a bottle with the front-desk scanner, or type the code off the box. Either way the count moves and the days-left figure moves with it."
        />
        <div className="l4-grid l4-grid-2">
          <div className="l4-card">
            <ScanReceiving />
          </div>
          <div className="l4-card">
            <StatRow label="Products tracked" value={board.rows.length} />
            <StatRow
              label="Barcodes on file"
              value={board.rows.length}
              hint="one manufacturer code per product"
            />
            <StatRow
              label="Counted in the last 30 days"
              value={board.rows.filter((r) => r.unitsSoldInWindow > 0).length}
            />
            <p className="l4-workings" style={{ marginTop: 12 }}>
              The front-desk scanner works anywhere on the Floor — scanning while this page is
              open adds to the count instead of ringing up a sale.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
