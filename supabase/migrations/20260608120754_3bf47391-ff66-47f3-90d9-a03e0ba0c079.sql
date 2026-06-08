
DROP POLICY IF EXISTS "Management can insert products" ON public.products;
DROP POLICY IF EXISTS "Management can update products" ON public.products;
DROP POLICY IF EXISTS "Management can delete products" ON public.products;

CREATE POLICY "Staff can insert products" ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'pharmacist') OR has_role(auth.uid(), 'manager')
  OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
);

CREATE POLICY "Staff can update products" ON public.products
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'pharmacist') OR has_role(auth.uid(), 'manager')
  OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
)
WITH CHECK (
  has_role(auth.uid(), 'pharmacist') OR has_role(auth.uid(), 'manager')
  OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
);

CREATE POLICY "Management can delete products" ON public.products
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
);
