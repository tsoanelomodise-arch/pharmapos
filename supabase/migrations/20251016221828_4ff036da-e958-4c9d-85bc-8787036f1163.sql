-- Add delete policy for profiles table allowing owners to delete
CREATE POLICY "Owners can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role));