# Plan: "Load More" for Transaction History

## Goal
Replace the Previous/Next pagination on Transactions > Transaction History with a **Load more** button at the bottom of the list. Each click shows 50 additional transactions **without removing** any already displayed.

## Current state (verified)
- `src/pages/Transactions.tsx` fetches all matching sales via `useAllSalesWithDetails` and paginates client-side: `itemsPerPage = 20`, `currentPage` state, `paginatedSales = sales.slice(...)`, with Prev/Next buttons and a "Page X of Y" header.
- All filters (date preset, custom range, payment method, search) already reset `currentPage` to 1.

## Changes (frontend only, one file)

### `src/pages/Transactions.tsx`
1. Replace `currentPage`/`itemsPerPage = 20` pagination state with a `visibleCount` state (initial value **20**, matching today's first page size).
2. Render `sales.slice(0, visibleCount)` — the list only ever grows; clicking Load more never removes rows already on screen.
3. Remove the Prev/Next pagination controls and the "Page X of Y" header label.
4. Add a footer under the table:
   - Text: `Showing X of Y transactions`.
   - **Load more** button (outline style) visible only when `visibleCount < sales.length`; on click: `setVisibleCount(c => c + 50)`.
5. Everywhere filters currently call `setCurrentPage(1)` (date preset, custom dates, payment method, debounced search), instead reset `setVisibleCount(20)` so a new filter starts fresh.
6. Clean up now-unused imports (`ChevronLeft`, `ChevronRight`).

### `src/pages/SystemUpdates.tsx`
- Prepend a changelog entry for this change (per project convention).

## Technical notes
- No database or hook changes needed — all matching transactions are already fetched; this change only controls how many are displayed at once.
- Behaviour: first load shows 20 rows → each Load more click adds 50 → button disappears once all matching transactions are shown.

## Verification
- `bun run build` passes.
- Confirm Load more appends 50 rows per click and hides when the end of the list is reached.
