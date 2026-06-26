## Goal

Let admins/owners credit a single line item (or several) directly from the Receipt view, without going to Transactions → Credit and re-selecting items in the multi-row dialog.

The underlying credit pipeline already exists (`useCreditSaleMutation` → `credit-sale` edge function) and supports partial per-item refunds with stock restore + proportional VAT/discount. This change is purely a new UX entry point on top of it.

## Changes

### 1. `src/components/ReceiptDialog.tsx`
- For each row in the **Items** list, show a small **"Credit"** button on the right (visible only to admin/owner via `useUserRole`, and hidden when the sale is `credited`, when it's already a credit note, or when that line has no remaining un-credited quantity).
- Compute per-line `alreadyCredited` and `remaining` the same way `CreditTransactionDialog` does — query linked credit notes (`sales` where `credit_note_for = saleId` with their `sale_items`) and subtract from the original quantity.
- Clicking the button opens a small inline confirmation popover/dialog with:
  - Item name, unit price, remaining qty
  - **Quantity** input (default 1, max = remaining)
  - **Reason** textarea (required, min 3 chars — same rule as edge function)
  - **Confirm Credit** / Cancel buttons
- On confirm, call `useCreditSaleMutation` with a single-item payload `{ saleId, reason, items: [{ saleItemId, quantity }] }`. Reuse the existing hook so query invalidation, toasts, and error handling stay consistent.
- After success, the receipt query is refetched (via existing invalidations + add `['sale-receipt', saleId]` to the invalidation list in `useCreditSale.ts`) so the remaining qty updates and the button disappears when the line is fully credited.

### 2. `src/hooks/useCreditSale.ts`
- Add `qc.invalidateQueries({ queryKey: ['sale-receipt'] })` so the open Receipt dialog refreshes after a per-line credit.

### 3. `src/pages/SystemUpdates.tsx`
- Append a new entry (per Core memory): "Credit individual line items directly from the Receipt dialog — admins/owners can refund a single product (with partial quantity) without opening the full Credit Transaction dialog."

## What does NOT change

- `CreditTransactionDialog` on Transactions stays as-is for bulk/multi-item credits.
- `credit-sale` edge function is unchanged — it already validates remaining qty per line, restores stock, posts proportional VAT/discount, and flips the sale to `credited` when nothing remains.
- No DB migration. No permission model changes.

## Technical notes

- Permission gate: `role === 'admin' || role === 'owner'` (mirrors Transactions page).
- Hide the per-line Credit button when `saleData.credit_note_for` is set or `saleData.payment_status === 'credited'`.
- For the "remaining qty" lookup, reuse the same query shape used in `CreditTransactionDialog` (`sales` filtered by `credit_note_for` with nested `sale_items(product_id, quantity)`); aggregate by `product_id` and subtract from each line's `quantity`.
- Use a `Popover` (already in the UI kit) anchored to the per-line Credit button to keep the receipt visually compact.
