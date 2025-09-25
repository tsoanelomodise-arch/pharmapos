-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing overly permissive customer policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Create role-based policies for customers (patient data)
-- Only pharmacists, admins, and managers can access patient data
CREATE POLICY "Authorized staff can view patients" 
ON public.customers 
FOR SELECT 
USING (
  public.get_current_user_role() IN ('pharmacist', 'admin', 'manager', 'owner')
);

CREATE POLICY "Authorized staff can create patients" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  public.get_current_user_role() IN ('pharmacist', 'admin', 'manager', 'owner')
);

CREATE POLICY "Authorized staff can update patients" 
ON public.customers 
FOR UPDATE 
USING (
  public.get_current_user_role() IN ('pharmacist', 'admin', 'manager', 'owner')
);

CREATE POLICY "Authorized staff can delete patients" 
ON public.customers 
FOR DELETE 
USING (
  public.get_current_user_role() IN ('admin', 'manager', 'owner')
);

-- Fix profiles table - restrict viewing to own profile and authorized roles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Authorized staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.get_current_user_role() IN ('admin', 'manager', 'owner')
);