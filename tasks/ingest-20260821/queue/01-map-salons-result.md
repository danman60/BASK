# Result

I have successfully created the `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-salons.ts` file according to the requirements. The file contains:

1. A proper doc comment explaining the purpose
2. Correct imports from './contract' including remapId, SALON_STATUS, OrgInput, and SalonInput
3. Two exported functions as requested:
   - `mapOrg()` that returns an OrgInput with deterministic ID mapping
   - `mapSalons()` that maps CSV rows to SalonInput[] with proper field mappings
4. The file passes TypeScript compilation (tsc --noEmit) without errors
5. All requirements met: no DB, no file I/O, no randomness, no any type, uses only contract symbols

The implementation correctly handles the salon mapping from the practice dataset's salons.csv to Bask OrgInput and SalonInput[] structures with deterministic ID remapping.

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
- d
- b
- /
- s
- c
- r
- i
- p
- t
- s
- /
- s
- a
- l
- o
- n
- -
- i
- n
- g
- e
- s
- t
- /
- e
- t
- l
- /
- m
- a
- p
- -
- s
- a
- l
- o
- n
- s
- .
- t
- s
- '
- ]