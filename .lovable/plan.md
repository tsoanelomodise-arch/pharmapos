## Goal

Restrict editing of past transactions in **Transaction History** to users with the `admin` or `owner` role only. The current `edit_transactions` module permission is too permissive — owners can grant it to any user (e.g., a cashier or pharmacist).

## Changes

### 1. Frontend — gate the Edit button by role (`src/pages/Transactions.tsx`)

Replace the module-permission check with a role check:

```ts
const { data: role } = useUserRole();
const canEditTransactions = role === 'admin' || role === 'owner';
```

Remove the now-unused `useUserModules` import and `edit_transactions` reference. This hides the pencil icon and the Edit dialog trigger from cashiers and pharmacists.

### 2. Backend — enforce at the database layer

The existing RLS policy `Staff can update sales` currently allows pharmacists, managers, admins, and owners to update sales rows. Tighten it via a new migration so only admins and owners can update `sales` and `sale_items` (this is what backs transaction edits). POS inserts remain unchanged.

```sql
DROP POLICY "Staff can update sales" ON public.sales;
CREATE POLICY "Admins and owners can update sales" ON public.sales
  FOR UPDATE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

DROP POLICY "Staff can update sale_items" ON public.sale_items;
CREATE POLICY "Admins and owners can update sale_items" ON public.sale_items
  FOR UPDATE USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
```

### 3. Memory update

Update `mem://access-control/transaction-editing-permission` to reflect that transaction editing is now role-gated (admin/owner) rather than module-permission-gated. The `edit_transactions` module permission itself stays in the system but no longer controls this UI (kept to avoid breaking the permissions manager); we can remove it later if you prefer.

## Out of scope

- The `EditTransactionDialog` component itself — no behavioral changes needed.
- Other module permissions.
- Removing the `edit_transactions` enum value (would require a larger migration; can do in a follow-up if desired).