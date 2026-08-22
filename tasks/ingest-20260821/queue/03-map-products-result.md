# Result

I have successfully created the `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-products.ts` file that maps products from CSV rows to Bask ProductInput format. The implementation:

1. Imports required functions (remapId, num, bool) and type (ProductInput) from './contract'
2. Exports a mapProducts function that transforms CSV rows into ProductInput[] 
3. Correctly maps all CSV fields according to the specification
4. Handles optional fields with appropriate null defaults
5. Uses the contract functions for data conversion as required
6. Passes TypeScript compilation without errors

The file meets all requirements including proper documentation, correct import paths, and adherence to the contract API surface.

## Files Changed
- /home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-products.ts