
# Credit Transactions (Full & Partial)

Add a "Credit" action so admins and owners can refund a completed sale — fully or per-item — with mandatory reason, automatic stock restoration, and a linked credit-note record that nets correctly into all reports.

## User-facing changes

1. **Transactions page** (`src/pages/Transactions.tsx`)
   - New "Credit" button (icon: RotateCcw) in the row actions, visible only to `admin`/`owner`.
   - Hidden when the sale is already fully credited; shows a "Credited" / "Partial credit" badge in the Status column.
   - Clicking opens the new **CreditTransactionDialog**.

2. **POS page** (`src/pages/POS.tsx`)
   - Recent-sales list/section gets the same "Credit" button (admin/owner only) opening the same dialog.

3. **CreditTransactionDialog** (new, `src/components/CreditTransactionDialog.tsx`)
   - Lists each sale line item with: original qty, already-credited qty (if any), and an input for "Qty to credit" (0…remaining).
   - "Credit all" shortcut sets every row to its remaining qty.
   - Required **Reason** textarea (e.g. damaged, customer return, wrong item).
   - Read-only summary: items selected, refund subtotal, VAT reversed, total refund (negative R value).
   - Confirm button calls the credit edge function.

4. **Status badge** updated to recognise `credited` (full) and a derived `partial` state (original `completed` + at least one linked credit note).

## Data model

Migration adds to `public.sales`:
- `credit_note_for uuid` — references the original sale this row credits (null for normal sales).
- `credit_reason text` — populated on credit-note rows and copied as a note on the original when fully credited.
- Index on `credit_note_for`.

A **credit note** is a regular row in `sales` with:
- `total_amount`, `tax_amount`, `discount_amount` stored as **negative** values.
- `payment_status = 'completed'` so it nets into existing report aggregations.
- `payment_method` copied from the original.
- `credit_note_for = original.id`, `credit_reason` set.
- Matching negative `sale_items` rows (negative `quantity`, negative `total_price`).

The original sale is updated:
- If every item is now fully credited → `payment_status = 'credited'` (drops out of completed-sales reports).
- Otherwise the original stays `completed`; the negative credit-note row offsets it in totals.

Stock: for each credited line, `products.stock_quantity` is incremented and a `stock_movements` row is inserted with `movement_type = 'return'`, positive quantity, `reference_id = creditNoteId`, note = `Credit: <reason>`.

The existing `log_audit_event` trigger on `sales`/`sale_items` automatically records the credit in the audit trail.

## Edge function

`supabase/functions/credit-sale/index.ts` (new). Performs the work server-side because it touches multiple tables and must be atomic-ish under one trusted actor.

- Validates the caller's JWT and confirms the role is `admin` or `owner` via `user_roles`.
- Input (Zod): `saleId`, `reason` (min 3 chars), `items: [{ saleItemId, quantity }]` with `quantity > 0` and `≤ remaining`.
- Loads the original sale + items, computes already-credited quantities by summing linked credit-note `sale_items`, rejects over-credit.
- Recomputes negative subtotal, VAT (using the original sale's effective rate: `tax_amount / (total - tax)`), and total.
- Inserts the credit-note `sales` row, then its negative `sale_items`, then increments stock and writes `stock_movements`.
- Marks the original `credited` if fully refunded.
- Returns the new credit note id; CORS handled.

Frontend calls it via `supabase.functions.invoke('credit-sale', ...)`.

## Reports & dashboard impact

All existing aggregations already filter `payment_status = 'completed'`, so:
- Full credits: original flips to `credited` → removed from revenue, transaction counts, top-products, sales-by-category, sales trend.
- Partial credits: original stays in; the negative credit-note row (also `completed`, negative totals, negative item quantities) nets it down. Items-sold counts, revenue, payment-method splits, average transaction value, and the dashboard "Inventory Items Sold" chart all reflect the net automatically.

No report files need code changes. The credit-note `sales` row carries the same `created_at` (defaults to now), so credits show up in the period they happen, which is the standard accounting approach.

## Permissions

- Frontend gate: `role === 'admin' || role === 'owner'` (same check pattern as delete).
- Backend gate: edge function re-validates role from `user_roles` — never trust the client.

## Changelog

Prepend a new `1.4.6` entry to `src/pages/SystemUpdates.tsx` describing the credit feature.

## Files touched

- New: `supabase/functions/credit-sale/index.ts`
- New: `src/components/CreditTransactionDialog.tsx`
- New: `src/hooks/useCreditSale.ts` (thin wrapper around `functions.invoke` + query invalidation)
- Edit: `src/pages/Transactions.tsx` (action button, status badge for credited/partial)
- Edit: `src/pages/POS.tsx` (action in recent-sales area)
- Edit: `src/hooks/useSales.ts` (extend `SaleWithDetails` with `credit_note_for`, `credit_reason`, and a `credited_items_count` derived in the query so the dialog/table can show remaining quantities)
- Edit: `src/pages/SystemUpdates.tsx`
- Migration: add `credit_note_for`, `credit_reason`, index on `sales`.

## Out of scope

- Re-printing a credit-note receipt (can reuse existing `ReceiptDialog` later if needed).
- Cash-drawer reconciliation for cash credits (UI shows the refund amount; physical cash handling is manual).
