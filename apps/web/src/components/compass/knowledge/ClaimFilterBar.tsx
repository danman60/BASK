import type { ClaimFilters } from '@bask/core';
import { REVIEW_STATES, REVIEW_STATE_LABEL, CLAIM_CATEGORIES } from '@bask/core';

/**
 * A horizontal bar of filter chips for claims.
 *
 * @param filters - The current filter state.
 * @param onChange - Callback when a filter is toggled.
 */
export function ClaimFilterBar({
  filters,
  onChange,
}: {
  filters: ClaimFilters;
  onChange: (filters: ClaimFilters) => void;
}) {
  const isAnyFilterActive =
    (filters.reviewState && filters.reviewState.length > 0) ||
    (filters.category && filters.category.length > 0) ||
    (filters.lens && filters.lens.length > 0);

  const handleToggle = (type: 'reviewState' | 'category' | 'lens', value: string) => {
    const current = filters[type] || [];
    const next = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];

    onChange({
      ...filters,
      [type]: next,
    });
  };

  return (
    <div className="cp-filterbar">
      {/* Review State Filter */}
      <div className="cp-filterbar-group">
        {REVIEW_STATES.map((state) => {
          const isSelected = (filters.reviewState || []).includes(state);
          return (
            <button
              key={state}
              type="button"
              className={`cp-chip ${isSelected ? 'cp-chip--on' : ''}`}
              onClick={() => handleToggle('reviewState', state)}
            >
              {REVIEW_STATE_LABEL[state]}
            </button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="cp-filterbar-group">
        {CLAIM_CATEGORIES.map((category) => {
          const isSelected = (filters.category || []).includes(category);
          return (
            <button
              key={category}
              type="button"
              className={`cp-chip ${isSelected ? 'cp-chip--on' : ''}`}
              onClick={() => handleToggle('category', category)}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Lens Filter */}
      <div className="cp-filterbar-group">
        {['advice', 'recall', 'marketing'].map((lens) => {
          const isSelected = (filters.lens || []).includes(lens);
          return (
            <button
              key={lens}
              type="button"
              className={`cp-chip ${isSelected ? 'cp-chip--on' : ''}`}
              onClick={() => handleToggle('lens', lens)}
            >
              {lens}
            </button>
          );
        })}
      </div>

      {/* Clear All Button */}
      {isAnyFilterActive && (
        <button
          type="button"
          className="cp-button"
          onClick={() =>
            onChange({
              reviewState: [],
              category: [],
              lens: [],
            })
          }
        >
          Clear all
        </button>
      )}
    </div>
  );
}