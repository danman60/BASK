/**
 * RecordsPanel — the last step of the drill-down: the owner's own rows.
 *
 * The chain is headline → evidence → RECORDS. The first two are the product
 * explaining itself; this one is the product getting out of the way. Every line
 * here is a visit that happened, with the lotion that did or did not go with it.
 *
 * The header recomputes the rate FROM THE ROWS and prints it beside the figure
 * the card quoted. When they agree it reads as a receipt. When they disagree it
 * SAYS SO — a provenance panel that can only ever confirm itself is decoration,
 * and the first time an owner catches it lying the feature is worth less than
 * nothing.
 *
 * Deliberately not a modal and not a spreadsheet: no sorting, no filtering, no
 * column menu. An owner opened this to answer one question — "is that real?" —
 * and every control added is a way to lose them before they get the answer.
 */

export interface RecordRowView {
  visitId: string;
  day: string;
  customerName: string;
  attached: boolean;
  productName: string | null;
  amountLabel: string | null;
}

export interface RecordsPanelProps {
  rows: readonly RecordRowView[];
  totalVisits: number;
  attachedVisits: number;
  /** Recomputed from the rows, not copied off the card. */
  ratePercent: number;
  /** What the card claimed, so the two can be shown together. */
  quotedPercent?: number | null;
  windowLabel: string;
  hiddenCount: number;
  id?: string;
}

/** Same-day formatting as the rest of Today: "Tue 5 Aug". */
function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function RecordsPanel({
  rows,
  totalVisits,
  attachedVisits,
  ratePercent,
  quotedPercent,
  windowLabel,
  hiddenCount,
  id,
}: RecordsPanelProps) {
  /* Half a point of tolerance: the card rounds to one decimal and so does this,
     so identical underlying data can still differ in the last digit. Anything
     wider than that is a real disagreement and gets said out loud. */
  const mismatch =
    typeof quotedPercent === 'number' && Math.abs(quotedPercent - ratePercent) > 0.5;

  return (
    <div className="b-records" id={id} role="region" data-testid="records-panel">
      <p className="b-records-head">
        <strong className="num">{attachedVisits}</strong> of{' '}
        <strong className="num">{totalVisits.toLocaleString('en-CA')}</strong> visits over{' '}
        {windowLabel} included a product — <strong className="num">{ratePercent}%</strong>
        {mismatch ? (
          <span className="b-records-flag">
            {' '}
            · the card says {quotedPercent}%, so these do not agree. Trust this list.
          </span>
        ) : (
          <span className="b-records-ok"> · counted from the visits below</span>
        )}
      </p>

      {/* `.b-dtable` rather than a table of its own: six components already share
          it, it carries the responsive rules that stack a wide table into labelled
          cards on a phone, and `.card:has(> .b-dtable)` gives the scroll wrapper.
          A seventh table shape here would be a seventh thing to keep in line. */}
      <div className="b-records-scroll">
        <table className="b-dtable">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Customer</th>
              <th scope="col">Bought</th>
              <th scope="col" className="num">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.visitId} data-attached={r.attached ? 'true' : 'false'}>
                <td>{dayLabel(r.day)}</td>
                <td className="b-dtable-who">{r.customerName || '—'}</td>
                <td className="b-dtable-why">
                  {r.productName ?? <span className="b-records-none">nothing</span>}
                </td>
                <td className="num">{r.amountLabel ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        /* Say what is not shown. A truncated list that does not admit it is
           truncated is the same lie as a rounded number that does not round. */
        <p className="b-records-more">
          Showing {rows.length} of {totalVisits.toLocaleString('en-CA')} visits — {hiddenCount}{' '}
          more in the window, all counted in the figure above.
        </p>
      )}
    </div>
  );
}
