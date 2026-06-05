DROP POLICY IF EXISTS "Management can delete prescriptions" ON public.prescriptions;
CREATE POLICY "Admins and owners can delete prescriptions"
ON public.prescriptions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));