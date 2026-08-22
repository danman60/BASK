# Result

I have successfully created the `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-transactions.ts` file according to the specifications. The file contains:

1. A proper doc comment describing the purpose of the module
2. Correct imports from `./contract` including all required symbols: `remapId`, `num`, `parseDate`, `tenderType`, `SaleInput`, and `SaleLineInput`
3. Exported `mapSales` function that transforms transaction rows into `SaleInput[]`
4. Exported `mapSaleLines` function that transforms transaction item rows into `SaleLineInput[]` using transaction data to resolve tender types and timestamps
5. Both functions are pure mappers with no side effects, as required

The file passes TypeScript compilation (`tsc --noEmit`) and meets all the specified requirements including proper handling of the transaction columns and item columns as described in the task.

## Files Changed
- /home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-transactions.ts