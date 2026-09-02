# Result

I have successfully created the PURE module for calculating salon peer standing as requested. The module includes:

1. A `StandingBand` type with the union of string literals 'top', 'above', 'below', 'bottom'
2. A `PeerMetric` interface with readonly fields: key, label, you, peerValues, and higherIsBetter
3. A `MetricStanding` interface with readonly fields: key, label, you, median, gapToMedian, band, and peerCount
4. A `medianOf` function that calculates the true median of values
5. A `bandFor` function that determines the standing band based on peer performance
6. A `standingFor` function that assembles all standing information for a metric
7. A `bestMetric` function that finds the best performing metric for a salon

The implementation follows the exemplar's style and conventions, includes proper documentation with explanations of the reasoning behind each rule, and imports only what's needed from './outcomes'. The module passes validation and meets all requirements.

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
- s
- t
- a
- n
- d
- i
- n
- g
- .
- t
- s
- '
- ]