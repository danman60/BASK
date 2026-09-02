# Result

I have successfully created the PeerStandingCard component as requested. The implementation:

1. Imports PositionBand from './BandChip' as required
2. Defines the StandingRow interface with readonly fields: label, youLabel, medianLabel, gapLabel, and band
3. Defines the PeerStandingCardProps interface with heading, peerCountLabel, rows, bestLabel, and optional className
4. Exports a function component PeerStandingCard that:
   - Renders a section with 'card' class and data-testid 'peer-standing-card'
   - Shows the heading and peerCountLabel (without the 'quiet' class which wasn't allowed)
   - Displays each row with label, youLabel, gapLabel, and BandChip for the band
   - Shows the bestLabel when provided
   - Handles empty rows case with appropriate message
   - Uses only allowed class names that match the exemplar's vocabulary

The component passes all validation checks including TypeScript compilation and the broker.vocab validation against the contract file.

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
- P
- e
- e
- r
- S
- t
- a
- n
- d
- i
- n
- g
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