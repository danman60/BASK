import type { ClaimFilters } from '@bask/core';
import { CLAIM_CATEGORIES, REVIEW_STATES, REVIEW_STATE_LABEL } from '@bask/core';

export function ClaimFilterBar({
  filters,
  onChange,
}: {
  filters: ClaimFilters;
  onChange: (filters: ClaimFilters) => void;
}) {
  const { reviewState, category, lens } = filters;

  const toggleFilter = (
    filterType: 'reviewState' | 'category' | 'lens',
    value: string
  ) => {
    const currentValues = filters[filterType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    
    onChange({
      ...filters,
      [filterType]: newValues,
    });
  };

  const clearAll = () => {
    onChange({
      reviewState: [],
      category: [],
      lens: [],
    });
  };

  const hasActiveFilters =
    (reviewState?.length || 0) > 0 ||
    (category?.length || 0) > 0 ||
    (lens?.length || 0) > 0;

  return (
    <>
      {REVIEW_STATES.map((state) => (
        <button
          key={state}
          type="button"
          className={`cp-chip ${reviewState?.includes(state) ? 'cp-chip--on' : ''}`}
          onClick={() => toggleFilter('reviewState', state)}
        >
          {REVIEW_STATE_LABEL[state]}
        </button>
      ))}

      {CLAIM_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`cp-chip ${category?.includes(cat) ? 'cp-chip--on' : ''}`}
          onClick={() => toggleFilter('category', cat)}
        >
          {cat}
        </button>
      ))}

      {['advice', 'recall', 'marketing'].map((lensValue) => (
        <button
          key={lensValue}
          type="button"
          className={`cp-chip ${lens?.includes(lensValue) ? 'cp-chip--on' : ''}`}
          onClick={() => toggleFilter('lens', lensValue)}
        >
          {lensValue}
        </button>
      ))}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
        >
          Clear all
        </button>
      )}
    </>
  );
}