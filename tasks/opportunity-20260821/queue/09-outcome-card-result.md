# Result

I have successfully created the OutcomeCard.tsx component as requested. The component:

1. Includes the exact doc comment as specified
2. Imports `OpportunityOutcome` from '@bask/core' 
3. Defines the correct props interface `OutcomeCardProps`
4. Implements the `OutcomeCard` function component with all required elements in the specified order:
   - Category div with outcome.window
   - Title h3 with outcome.opportunityTitle
   - Funnel with actionTaken → executed → result steps
   - Revenue label div with outcome.revenueLabel
   - Learned paragraph with outcome.learned
5. Uses the correct className structure with filtering for optional className
6. Includes the data-testid="outcome-card" attribute

The component was verified to compile without errors using `tsc --noEmit` in the ui package directory.

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
- p
- a
- c
- k
- a
- g
- e
- s
- /
- u
- i
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
- O
- u
- t
- c
- o
- m
- e
- C
- a
- r
- d
- .
- t
- s
- x
- '
- ]