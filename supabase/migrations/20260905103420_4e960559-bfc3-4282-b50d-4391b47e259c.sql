DROP POLICY IF EXISTS "Admins and owners can update sales" ON public.sales;
CREATE POLICY "Admins owners or permitted staff can update sales" ON public.sales FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_module_access(auth.uid(),'edit_transactions'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_module_access(auth.uid(),'edit_transactions'));

DROP POLICY IF EXISTS "Admins and owners can update sale_items" ON public.sale_items;
CREATE POLICY "Admins owners or permitted staff can update sale_items" ON public.sale_items FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_module_access(auth.uid(),'edit_transactions'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_module_access(auth.uid(),'edit_transactions'));