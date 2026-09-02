# Result

I have successfully created the scaling helpers module for the insights rules engine as requested. The file `/home/danman60/projects/uvalux-platform/packages/core/src/insights/scaling.ts` contains exactly what was specified:

1. An interface named `MaterialityRule` with two readonly number fields: `absolutePoints` and `relativeShare`
2. A function `isMaterialDrop` that returns true when a fall clears either the absolute test OR the relative test
3. A function `isMaterialGap` with the same logic for judging gaps
4. A function `relativeShortfall` that returns the relative shortfall as a share of the baseline, clamped to 0-1

The implementation follows the exemplar's style and conventions, includes comprehensive doc comments explaining the reasoning with the concrete numbers mentioned (5.28% baseline), and imports only from `../evidence` as required. The module passes TypeScript compilation and vocab validation.

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
- c
- o
- r
- e
- /
- s
- r
- c
- /
- i
- n
- s
- i
- g
- h
- t
- s
- /
- s
- c
- a
- l
- i
- n
- g
- .
- t
- s
- '
- ]