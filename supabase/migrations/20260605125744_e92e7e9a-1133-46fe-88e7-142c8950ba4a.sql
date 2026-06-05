
DROP POLICY IF EXISTS "Staff can update sales" ON public.sales;
CREATE POLICY "Admins and owners can update sales" ON public.sales FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

DROP POLICY IF EXISTS "Staff can update sale_items" ON public.sale_items;
CREATE POLICY "Admins and owners can update sale_items" ON public.sale_items FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
