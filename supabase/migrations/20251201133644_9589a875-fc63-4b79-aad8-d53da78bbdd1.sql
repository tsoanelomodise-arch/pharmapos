-- Create audit log table for customer access tracking
CREATE TABLE IF NOT EXISTS public.customer_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('view', 'edit', 'delete')),
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  user_role app_role,
  ip_address text,
  notes text
);

-- Enable RLS on audit logs
ALTER TABLE public.customer_access_logs ENABLE ROW LEVEL SECURITY;

-- Management can view all logs
CREATE POLICY "Management can view all access logs"
ON public.customer_access_logs FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- Users can view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.customer_access_logs FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can insert logs
CREATE POLICY "Authenticated users can insert access logs"
ON public.customer_access_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_customer_access_logs_customer_id ON public.customer_access_logs(customer_id);
CREATE INDEX idx_customer_access_logs_user_id ON public.customer_access_logs(user_id);
CREATE INDEX idx_customer_access_logs_accessed_at ON public.customer_access_logs(accessed_at DESC);

-- Create function to log customer access
CREATE OR REPLACE FUNCTION public.log_customer_access(
  _customer_id uuid,
  _access_type text,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
BEGIN
  -- Get user's role
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Insert audit log
  INSERT INTO public.customer_access_logs (
    user_id,
    customer_id,
    access_type,
    user_role,
    notes
  ) VALUES (
    auth.uid(),
    _customer_id,
    _access_type,
    _user_role,
    _notes
  );
END;
$$;

-- Create view with field-level security
CREATE OR REPLACE VIEW public.customers_secure AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  c.address,
  c.date_of_birth,
  -- Sensitive fields only for management roles
  CASE 
    WHEN has_role(auth.uid(), 'manager'::app_role) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'owner'::app_role)
    THEN c.insurance_info
    ELSE NULL
  END as insurance_info,
  CASE 
    WHEN has_role(auth.uid(), 'manager'::app_role) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'owner'::app_role)
    THEN c.credit_limit
    ELSE NULL
  END as credit_limit,
  CASE 
    WHEN has_role(auth.uid(), 'manager'::app_role) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'owner'::app_role)
    THEN c.current_balance
    ELSE NULL
  END as current_balance,
  c.created_at,
  c.updated_at
FROM public.customers c;

-- Grant access to the view
GRANT SELECT ON public.customers_secure TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.customers_secure IS 'Secure view of customers table with field-level access control. Insurance info and financial data restricted to management roles. All access should be logged using log_customer_access() function.';