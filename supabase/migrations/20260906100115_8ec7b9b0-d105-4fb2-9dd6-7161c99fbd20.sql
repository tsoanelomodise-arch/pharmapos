DROP POLICY IF EXISTS "Management can delete sale_items" ON public.sale_items;

CREATE POLICY "Admins owners or permitted staff can delete sale_items"
ON public.sale_items
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_module_access(auth.uid(), 'edit_transactions'::app_module)
);