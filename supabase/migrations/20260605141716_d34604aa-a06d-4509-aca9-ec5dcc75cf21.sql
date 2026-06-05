
-- Tighten SELECT policies to staff roles only

-- products
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Staff can view products" ON public.products
FOR SELECT USING (
  has_role(auth.uid(), 'pharmacist'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- product_suppliers
DROP POLICY IF EXISTS "Authenticated users can view product_suppliers" ON public.product_suppliers;
CREATE POLICY "Management can view product_suppliers" ON public.product_suppliers
FOR SELECT USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- sales
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
CREATE POLICY "Staff can view sales" ON public.sales
FOR SELECT USING (
  has_role(auth.uid(), 'pharmacist'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- sale_items
DROP POLICY IF EXISTS "Authenticated users can view sale_items" ON public.sale_items;
CREATE POLICY "Staff can view sale_items" ON public.sale_items
FOR SELECT USING (
  has_role(auth.uid(), 'pharmacist'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- stock_movements
DROP POLICY IF EXISTS "Authenticated users can view stock_movements" ON public.stock_movements;
CREATE POLICY "Staff can view stock_movements" ON public.stock_movements
FOR SELECT USING (
  has_role(auth.uid(), 'pharmacist'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- business_settings
DROP POLICY IF EXISTS "Authenticated users can view business settings" ON public.business_settings;
CREATE POLICY "Staff can view business settings" ON public.business_settings
FOR SELECT USING (
  has_role(auth.uid(), 'pharmacist'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);
