-- Drop the existing security definer view
DROP VIEW IF EXISTS public.customers_secure;

-- Recreate the view without SECURITY DEFINER
-- The view filters sensitive financial columns based on user role
CREATE VIEW public.customers_secure AS
SELECT 
  id,
  name,
  phone,
  email,
  address,
  date_of_birth,
  created_at,
  updated_at,
  CASE 
    WHEN has_role(auth.uid(), 'manager') OR 
         has_role(auth.uid(), 'admin') OR 
         has_role(auth.uid(), 'owner') 
    THEN insurance_info 
    ELSE NULL 
  END as insurance_info,
  CASE 
    WHEN has_role(auth.uid(), 'manager') OR 
         has_role(auth.uid(), 'admin') OR 
         has_role(auth.uid(), 'owner') 
    THEN credit_limit 
    ELSE NULL 
  END as credit_limit,
  CASE 
    WHEN has_role(auth.uid(), 'manager') OR 
         has_role(auth.uid(), 'admin') OR 
         has_role(auth.uid(), 'owner') 
    THEN current_balance 
    ELSE NULL 
  END as current_balance
FROM public.customers
WHERE has_role(auth.uid(), 'pharmacist') OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'manager') OR
      has_role(auth.uid(), 'owner');