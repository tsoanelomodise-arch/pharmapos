# Hide Recent Transactions from Pharmacist Role

## Goal
On the POS page, the "Recent Transactions" listview should only be visible to admin and owner roles. Pharmacists (and managers/cashiers) should not see it.

## Changes
- **File: `src/pages/POS.tsx`**
  1. Import `useUserRole` from `@/hooks/useUserRole`
  2. Call `useUserRole()` to get the current user's role
  3. Compute `canViewTransactions = role === 'admin' || role === 'owner'`
  4. Wrap the "Recent Transactions" card (lines 369–421) in a conditional render so it only appears when `canViewTransactions` is true

No database or other file changes are needed.