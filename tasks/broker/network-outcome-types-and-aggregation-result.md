# Result

I have successfully created the network outcomes module as specified. The file `/home/danman60/projects/uvalux-platform/packages/core/src/network/outcomes.ts` contains:

1. Two interfaces: `NetworkOutcomeRecord` and `NetworkOutcomeSummary` with all required readonly fields
2. A constant `MIN_SALONS_FOR_CONFIDENCE` set to 5 with appropriate documentation
3. A function `summariseNetworkOutcomes` that aggregates records by actionKey and signalType, computes statistics including median values, success rates, and confidence levels
4. Proper documentation following the exemplar style with plain-language explanations of the reasoning
5. All imports from `../opportunities/types` as required
6. No default export as specified

The implementation correctly handles all requirements including:
- Grouping records by actionKey and signalType pairs
- Computing median values properly (using true median, not mean)
- Sorting results with confident groups first, then by success rate descending, then by salonsTried descending
- Proper handling of edge cases like empty inputs and zero division
- All validation checks pass successfully

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
- n
- e
- t
- w
- o
- r
- k
- /
- o
- u
- t
- c
- o
- m
- e
- s
- .
- t
- s
- '
- ]