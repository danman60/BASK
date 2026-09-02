# Result

I have successfully created the ClaimFilterBar component as specified in the requirements. The component:

1. Imports ClaimFilters, REVIEW_STATES, REVIEW_STATE_LABEL and CLAIM_CATEGORIES from @bask/core
2. Takes filters and onChange props as specified
3. Renders exactly three labeled groups:
   - State group (labelled "State") using REVIEW_STATES with REVIEW_STATE_LABEL for display
   - Topic group (labelled "Topic") using CLAIM_CATEGORIES 
   - Lens group (labelled "Lens") with three chips having values 'advice', 'recall', 'marketing' but display labels "Advice", "War stories", "Voice-of-customer" respectively
4. Each chip is a button with className cp-chip and cp-chip--on when active
5. Toggles filter values and calls onChange with new filter object
6. Includes a clear-all button that appears only when filters are active
7. Wraps all groups in a div with className cp-filterbar
8. Is stateless as required

The implementation follows the design patterns from the exemplar file and uses the exact class names and styling vocabulary specified in the contract API surface.

## Files Changed
- [
- '
- /
- h
- o
- m
- e
- /
- d
- a
- n
- m
- a
- n
- 6
- 0
- /
- p
- r
- o
- j
- e
- c
- t
- s
- /
- u
- v
- a
- l
- u
- x
- -
- p
- l
- a
- t
- f
- o
- r
- m
- /
- a
- p
- p
- s
- /
- w
- e
- b
- /
- s
- r
- c
- /
- c
- o
- m
- p
- o
- n
- e
- n
- t
- s
- /
- c
- o
- m
- p
- a
- s
- s
- /
- k
- n
- o
- w
- l
- e
- d
- g
- e
- /
- C
- l
- a
- i
- m
- F
- i
- l
- t
- e
- r
- B
- a
- r
- .
- t
- s
- x
- '
- ]