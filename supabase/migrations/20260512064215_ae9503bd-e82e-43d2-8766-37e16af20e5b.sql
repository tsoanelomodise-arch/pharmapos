
-- 1. Tighten prescriptions RLS: role-based access
DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can insert prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can update prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can delete prescriptions" ON public.prescriptions;

CREATE POLICY "Staff can view prescriptions"
  ON public.prescriptions FOR SELECT
  USING (
    has_role(auth.uid(), 'pharmacist'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Staff can insert prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'pharmacist'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Staff can update prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (
    has_role(auth.uid(), 'pharmacist'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Management can delete prescriptions"
  ON public.prescriptions FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

-- 2. Prevent privilege escalation: only owners can assign or modify the 'owner' role
DROP POLICY IF EXISTS "Admins and owners can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and owners can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and owners can delete roles" ON public.user_roles;

CREATE POLICY "Role assignment with owner protection"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'owner'::app_role)
    )
    AND (
      role <> 'owner'::app_role
      OR has_role(auth.uid(), 'owner'::app_role)
    )
  );

CREATE POLICY "Role update with owner protection"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'owner'::app_role)
    )
    AND (
      role <> 'owner'::app_role
      OR has_role(auth.uid(), 'owner'::app_role)
    )
  )
  WITH CHECK (
    (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'owner'::app_role)
    )
    AND (
      role <> 'owner'::app_role
      OR has_role(auth.uid(), 'owner'::app_role)
    )
  );

CREATE POLICY "Role delete with owner protection"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'owner'::app_role)
    )
    AND (
      role <> 'owner'::app_role
      OR has_role(auth.uid(), 'owner'::app_role)
    )
  );

-- 3. Defensive: ensure obsolete function is gone
DROP FUNCTION IF EXISTS public.get_current_user_role();
