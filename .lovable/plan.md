## Restrict Patient PII to Management + Treatment Relationship

### Problem
All staff (including pharmacists) can read full patient PII (name, phone, email, address, DOB) for every patient — even patients they have no treatment relationship with. The `customers_secure` view only masks financial fields, not basic PII.

### Solution

Implement a **two-layer fix**:
1. **Mask basic PII** in `customers_secure` for non-management roles, except where there is a documented treatment relationship.
2. **Add a "treatment relationship" check** so pharmacists only see full PII for patients they have actually served (have a prescription or sale linked to them).

### Database changes (migration)

**1. Recreate `customers_secure` view with PII masking for pharmacists:**

```sql
DROP VIEW IF EXISTS public.customers_secure CASCADE;

-- Helper: has the current user treated this patient?
CREATE OR REPLACE FUNCTION public.has_treatment_relationship(_customer_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.prescriptions
    WHERE customer_id = _customer_id AND dispensed_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.sales
    WHERE customer_id = _customer_id AND processed_by = auth.uid()
  );
$$;

CREATE VIEW public.customers_secure WITH (security_invoker = true) AS
SELECT
  id,
  name,  -- name remains visible to all staff (needed for search/lookup)
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner') OR has_treatment_relationship(id)
       THEN phone ELSE NULL END AS phone,
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner') OR has_treatment_relationship(id)
       THEN email ELSE NULL END AS email,
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner') OR has_treatment_relationship(id)
       THEN address ELSE NULL END AS address,
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner') OR has_treatment_relationship(id)
       THEN date_of_birth ELSE NULL END AS date_of_birth,
  created_at, updated_at,
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner')
       THEN insurance_info ELSE NULL END AS insurance_info,
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner')
       THEN credit_limit ELSE NULL END AS credit_limit,
  CASE WHEN has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')
            OR has_role(auth.uid(),'owner')
       THEN current_balance ELSE NULL END AS current_balance
FROM public.customers
WHERE has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'admin')
   OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner');

GRANT SELECT ON public.customers_secure TO authenticated;
```

**2. Tighten base `customers` table SELECT policy** so direct table access is restricted to management only (pharmacists must use the view):

```sql
DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;

CREATE POLICY "Management can view customers directly"
  ON public.customers FOR SELECT
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')
         OR has_role(auth.uid(),'owner'));
```

This keeps INSERT/UPDATE policies intact (pharmacists can still create/update patients during workflow).

### Frontend changes

**`src/components/CustomerForm.tsx`** — after insert/update, the `.select()` chain reads back from `customers`. Update the select to use `customers_secure` (or omit `.select()` for non-management users). Verify both insert (line 160) and update (line 166) paths.

**`src/components/QuickPatientForm.tsx`** (line 51) — same: reads from `customers` after insert. Switch the read-back to `customers_secure`.

**`src/hooks/useReportsData.ts`** (lines 126, 130) — only selects `id` for counting; switch to `customers_secure` for consistency. No data exposure here but keeps a single access path.

**`src/hooks/useCustomers.ts`** (line 85, `useDeleteCustomer`) — already uses `.from('customers').delete()`, which is fine because the management-only DELETE policy already exists.

### Audit logging note

Postgres does not support `AFTER SELECT` triggers, so the scan's suggested trigger is not implementable. We rely on the existing `log_customer_access()` RPC, called manually from sensitive flows. We will document this limitation but not add a fake trigger.

### Files modified
- New migration (view + helper function + RLS policy)
- `src/components/CustomerForm.tsx`
- `src/components/QuickPatientForm.tsx`
- `src/hooks/useReportsData.ts`

### Security finding
After applying, mark `customer_pii_exposed` as fixed with explanation referencing PII masking + treatment-relationship gating + base-table lockdown.
