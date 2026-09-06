DROP POLICY IF EXISTS "Restock creators can insert records" ON public.restock_records;
CREATE POLICY "Restock creators can insert records"
  ON public.restock_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'pharmacist'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'restock'::app_role)
  );