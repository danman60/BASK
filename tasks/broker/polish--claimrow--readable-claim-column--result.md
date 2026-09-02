# Result

I have completed the ClaimRow component according to the specifications. The component:

1. Imports Claim and formatTimecode from @bask/core
2. Has props: claim, focused boolean, onSelect (onVerify and onReject are accepted but not used in rendering as they're not needed for display)
3. Renders exactly four cells in order:
   - First cell: narrow state cell with span having className cp-state-dot plus state class (cp-state-dot--{state})
   - Second cell: claim text in td with className cp-claim-cell, wrapped in span with className cp-claim-text
   - Third cell: category in td with className cp-topic-cell
   - Fourth cell: timecode of first provenance entry via formatTimecode in td with className cp-at-cell
4. The tr gets className cp-claim-row and additionally cp-claim-row--focused when focused
5. onClick calls onSelect
6. No colors, no moment or sources count rendered (as specified)
7. Uses only class names from the design vocabulary

The implementation is complete and matches all requirements exactly.

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
- R
- o
- w
- .
- t
- s
- x
- '
- ]