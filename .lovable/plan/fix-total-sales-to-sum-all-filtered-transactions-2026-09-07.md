# Fix Total Sales to Sum All Filtered Transactions

## Problem

On Transactions (POS & Sales > Transaction History), the summary cards are computed from the rows the app actually loaded. The database only returns up to 1000 rows per request (PostgREST default cap), so when the selected filter matches more than 1000 transactions:

- **Total Transactions** stops at 1000 (as seen in the screenshot)
- **Total Sales** is the sum of only those 1000 records — not the full filtered period
- **Avg. Transaction** is skewed by the same cap

## Fix

Compute the three summary cards from a server-side aggregate over ALL records matching the current filters (date range + payment method), independent of what the list has loaded.

### Changes

1. **New database function** (migration): `public.sales_summary(_start_date timestamptz, _end_date timestamptz, _payment_method text)` returning `total_count`, `total_amount`, `avg_amount` — a single aggregate query over the `sales` table, excluding nothing the current page doesn't already show (same filter rules: date range, payment method). Grant execute to authenticated; wrap in the same role/RLS semantics the sales table uses (security invoker so existing sales SELECT policies apply).

2. **New hook** in `src/hooks/useSales.ts`: `useSalesSummary(filters)` that calls the RPC with the active date preset / custom range / payment method.

3. **Update `src/pages/Transactions.tsx`**: summary cards read from `useSalesSummary` instead of reducing the loaded rows. The search box still filters the list client-side; when a search term is active, cards keep the current behavior (sum of the matching loaded records) — otherwise they show the full period totals.

4. **Log the change** in `src/pages/SystemUpdates.tsx` (v1.7.4).

## Technical details

- `supabase/migrations/<timestamp>_sales_summary_function.sql` — CREATE FUNCTION + GRANT EXECUTE
- `src/hooks/useSales.ts` — add `useSalesSummary`
- `src/pages/Transactions.tsx` — swap summary card data source
- `src/pages/SystemUpdates.tsx` — changelog entry

## Verification

- Typecheck + build pass
- Select "Last 30 Days" and confirm Total Transactions can exceed 1000 and Total Sales covers the full range
