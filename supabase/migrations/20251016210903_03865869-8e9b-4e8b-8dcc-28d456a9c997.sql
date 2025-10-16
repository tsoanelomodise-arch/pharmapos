-- Drop the problematic ALL policy that causes recursion
DROP POLICY IF EXISTS "Only owners can manage roles" ON public.user_roles;

-- Create separate policies for INSERT, UPDATE, DELETE (not SELECT to avoid recursion)
CREATE POLICY "Only owners can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'::app_role
  )
);

CREATE POLICY "Only owners can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'::app_role
  )
);

CREATE POLICY "Only owners can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'::app_role
  )
);