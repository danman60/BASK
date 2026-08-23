/**
 * How much of the corpus a human has decided on.
 *
 * The bar's colour comes from `--c-amber` via `.cp-progress-fill`. The first
 * version of this file hardcoded `#3b82f6` — a blue bar in an amber product —
 * which is exactly why the house rule is that no component carries a colour
 * literal. If a shade looks wrong, the token is wrong, not the component.
 *
 * The sentence beneath always carries both absolute numbers. A bare "6%" hides
 * whether the corpus is 100 claims or 1,000.
 */
export function ReviewProgressBar({ decided, total }: { decided: number; total: number }) {
  if (total === 0) {
    return <p className="cp-note">Nothing to review yet.</p>;
  }

  const pct = Math.round((decided / total) * 100);

  return (
    <div className="cp-progress-wrap">
      <div
        className="cp-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={decided}
        aria-label="Claims decided"
      >
        <div className="cp-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="cp-note">
        {decided.toLocaleString()} of {total.toLocaleString()} claims decided ({pct}%)
      </p>
    </div>
  );
}
