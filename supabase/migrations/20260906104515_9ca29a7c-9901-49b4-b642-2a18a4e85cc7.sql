CREATE OR REPLACE FUNCTION public.enforce_sales_created_at_insert_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_at IS DISTINCT FROM now()
     AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) THEN
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_sales_created_at_insert_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_sales_created_at_insert_admin_trigger ON public.sales;
CREATE TRIGGER enforce_sales_created_at_insert_admin_trigger
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.enforce_sales_created_at_insert_admin();