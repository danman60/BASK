import { BandChip, type HealthBand } from './BandChip';

/**
 * Who to call today, and why.
 *
 * The `why` string is written by `healthReason` in @bask/core, not here — the
 * reason a customer is flagged has to match the score that flagged them, and a
 * second copy of that wording in the UI is how they drift apart.
 *
 * Built by hand after the local model's two attempts were rejected. Its output
 * was substantively right; it declared the component as `React.FC`, which this
 * package does not use anywhere and which references the React namespace without
 * importing it. Kept its markup, moved it to the house shape.
 */
export interface SlippingRow {
  id: string;
  name: string;
  band: HealthBand;
  /** e.g. "38 days ago" — already formatted by the caller. */
  lastVisit: string;
  /** e.g. "every 9 days" — the customer's own rhythm, already formatted. */
  usual: string;
  /** One sentence from `healthReason`. */
  why: string;
}

export interface SlippingListProps {
  rows: readonly SlippingRow[];
  /** Optional. When given, each row shows a draft button. */
  onDraft?: (id: string) => void;
  className?: string;
}

export function SlippingList({ rows, onDraft, className }: SlippingListProps) {
  if (rows.length === 0) {
    return (
      <section
        className={['card', className].filter(Boolean).join(' ')}
        data-testid="slipping-list"
      >
        <p className="b-dtable-empty">Nobody needs a call today.</p>
      </section>
    );
  }

  return (
    <section
      className={['card', className].filter(Boolean).join(' ')}
      data-testid="slipping-list"
    >
      <table className="b-dtable">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Last visit</th>
            <th>Usually</th>
            <th>Band</th>
            <th>Why</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="b-dtable-who">{row.name}</td>
              <td>{row.lastVisit}</td>
              <td>{row.usual}</td>
              <td>
                <BandChip band={row.band} />
              </td>
              <td className="b-dtable-why">{row.why}</td>
              <td>
                {onDraft ? (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => onDraft(row.id)}
                  >
                    Draft a note
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
