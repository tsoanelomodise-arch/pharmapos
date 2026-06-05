
-- PRODUCTS: restrict writes to management
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Management can insert products" ON public.products FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can update products" ON public.products FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can delete products" ON public.products FOR DELETE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));

-- SALES: staff can write, management can delete
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;

CREATE POLICY "Staff can insert sales" ON public.sales FOR INSERT
  WITH CHECK (has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Staff can update sales" ON public.sales FOR UPDATE
  USING (has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can delete sales" ON public.sales FOR DELETE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));

-- SALE ITEMS: same
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON public.sale_items;

CREATE POLICY "Staff can insert sale_items" ON public.sale_items FOR INSERT
  WITH CHECK (has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Staff can update sale_items" ON public.sale_items FOR UPDATE
  USING (has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can delete sale_items" ON public.sale_items FOR DELETE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));

-- STOCK MOVEMENTS: staff can insert; management can update/delete (protect audit trail)
DROP POLICY IF EXISTS "Authenticated users can insert stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can update stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can delete stock_movements" ON public.stock_movements;

CREATE POLICY "Staff can insert stock_movements" ON public.stock_movements FOR INSERT
  WITH CHECK (has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can update stock_movements" ON public.stock_movements FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can delete stock_movements" ON public.stock_movements FOR DELETE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));

-- PRODUCT_SUPPLIERS: management writes
DROP POLICY IF EXISTS "Authenticated users can insert product_suppliers" ON public.product_suppliers;
DROP POLICY IF EXISTS "Authenticated users can update product_suppliers" ON public.product_suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete product_suppliers" ON public.product_suppliers;

CREATE POLICY "Management can insert product_suppliers" ON public.product_suppliers FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can update product_suppliers" ON public.product_suppliers FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Management can delete product_suppliers" ON public.product_suppliers FOR DELETE
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner'));

-- USER ROLES: only owner can grant admin or owner
DROP POLICY IF EXISTS "Role assignment with owner protection" ON public.user_roles;
DROP POLICY IF EXISTS "Role update with owner protection" ON public.user_roles;
DROP POLICY IF EXISTS "Role delete with owner protection" ON public.user_roles;

CREATE POLICY "Role insert with escalation protection" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
    AND (role NOT IN ('owner','admin') OR has_role(auth.uid(),'owner'))
  );
CREATE POLICY "Role update with escalation protection" ON public.user_roles FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
    AND (role NOT IN ('owner','admin') OR has_role(auth.uid(),'owner'))
  )
  WITH CHECK (
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
    AND (role NOT IN ('owner','admin') OR has_role(auth.uid(),'owner'))
  );
CREATE POLICY "Role delete with escalation protection" ON public.user_roles FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
    AND (role NOT IN ('owner','admin') OR has_role(auth.uid(),'owner'))
  );

-- Revoke execute on SECURITY DEFINER helpers from anon (signed-out)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, app_module) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_modules(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_customer_access(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, app_module) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_modules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_customer_access(uuid, text, text) TO authenticated;
