

## Add Restocking Feature with History Log via stock_movements

### What we're building
1. A **Restock Dialog** to quickly restock out-of-stock and low-stock items, recording each restock in `stock_movements`
2. A **Restock History tab** on the Stock page showing all restock events
3. Restock mutations in `useProducts.ts`

### No database changes needed
The `stock_movements` table already has the right schema (`product_id`, `quantity`, `movement_type`, `notes`, `created_at`). Restock entries will use `movement_type: 'adjustment'` with notes prefixed `"Restock:"`.

### Files to create

**`src/components/RestockDialog.tsx`**
- Dialog triggered by a "Restock" button
- Shows table of products where `stock_quantity <= minimum_stock`
- Columns: Product Name, Current Stock, Min Stock, Restock Qty (number input)
- "Restock All" button processes all items with non-zero restock quantities
- Each restock: increments `products.stock_quantity` and inserts into `stock_movements` with `movement_type: 'adjustment'`, `notes: 'Restock: [quantity] units added'`, positive quantity

**`src/components/RestockHistoryLog.tsx`**
- Queries `stock_movements` where `notes` starts with "Restock:"
- Table columns: Date/Time, Product Name, Quantity Restocked, Notes
- Date range filter (Today, 7 days, 30 days, All)

### Files to modify

**`src/hooks/useProducts.ts`**
- Add `useRestockMutation`: accepts `{ productId, quantity, notes? }`, adds quantity to stock, inserts stock_movement with `movement_type: 'adjustment'` and `notes: 'Restock: ...'`
- Add `useBulkRestockMutation`: accepts array of `{ productId, quantity }`, processes sequentially
- Invalidates `products`, `low-stock-products`, `stock-movements`, `dashboard-stats`

**`src/pages/Stock.tsx`**
- Import and add `RestockDialog` button next to `StockReportDialog` and `ProductForm` in header
- Add inline "Restock" button on each low-stock item row
- Add new tab "Restock History" rendering `RestockHistoryLog`

