import { CLAIM_CATEGORIES, REVIEW_STATE_LABEL } from '@bask/core';
import type { ClaimFilters } from '@bask/core';

/**
 * Filter chips, in three LABELLED groups.
 *
 * The labels are not decoration. Before them this was twelve undifferentiated
 * pills containing the word "marketing" TWICE — once as a topic, once as a lens —
 * adjacent and meaning different things. Grouping them and renaming the lens to
 * "Voice-of-customer" is what makes the bar readable.
 */

/** Only these three fields on ClaimFilters are arrays; the rest are not. */
type ArrayFilterKey = 'reviewState' | 'category' | 'lens';

const LENSES: { value: string; label: string }[] = [
  { value: 'advice', label: 'Advice' },
  { value: 'recall', label: 'War stories' },
  { value: 'marketing', label: 'Voice-of-customer' },
];

export function ClaimFilterBar({
  filters,
  onChange,
}: {
  filters: ClaimFilters;
  onChange: (filters: ClaimFilters) => void;
}) {
  // One narrowing point. Indexing ClaimFilters by a bare `keyof` widens to a
  // union spanning strings and booleans, which is what made every call site
  // fight the compiler.
  const valuesFor = (key: ArrayFilterKey): string[] =>
    (filters[key] as string[] | undefined) ?? [];

  const isAnyActive =
    valuesFor('reviewState').length > 0 ||
    valuesFor('category').length > 0 ||
    valuesFor('lens').length > 0;

  const toggle = (key: ArrayFilterKey, value: string) => {
    const current = valuesFor(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const clearAll = () =>
    onChange({ ...filters, reviewState: [], category: [], lens: [] });

  return (
    <div className="cp-filterbar">
      <div className="cp-filtergroup">
        <span className="cp-filtergroup-label">State</span>
        {(Object.keys(REVIEW_STATE_LABEL) as Array<keyof typeof REVIEW_STATE_LABEL>).map(
          (key) => (
            <button
              key={key}
              type="button"
              className={`cp-chip ${valuesFor('reviewState').includes(key) ? 'cp-chip--on' : ''}`}
              onClick={() => toggle('reviewState', key)}
            >
              {REVIEW_STATE_LABEL[key]}
            </button>
          ),
        )}
      </div>

      <div className="cp-filtergroup">
        <span className="cp-filtergroup-label">Topic</span>
        {CLAIM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`cp-chip ${valuesFor('category').includes(cat) ? 'cp-chip--on' : ''}`}
            onClick={() => toggle('category', cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="cp-filtergroup">
        <span className="cp-filtergroup-label">Lens</span>
        {LENSES.map((l) => (
          <button
            key={l.value}
            type="button"
            className={`cp-chip ${valuesFor('lens').includes(l.value) ? 'cp-chip--on' : ''}`}
            onClick={() => toggle('lens', l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {isAnyActive && (
        <button type="button" className="cp-chip cp-chip--clear" onClick={clearAll}>
          Clear all
        </button>
      )}
    </div>
  );
}
