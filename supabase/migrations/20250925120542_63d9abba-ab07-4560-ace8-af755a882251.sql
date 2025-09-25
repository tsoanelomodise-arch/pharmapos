-- Remove dangerous public access policies and implement secure RLS
-- This fixes the critical security vulnerability where customer PII is publicly accessible

-- Drop the existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations on prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all operations on sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow all operations on stock_movements" ON public.stock_movements;

-- Create a profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'pharmacist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies that require authentication

-- Customers table - restrict to authenticated users only
CREATE POLICY "Authenticated users can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (true);

-- Sales table - restrict to authenticated users only
CREATE POLICY "Authenticated users can view sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sales" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (true);

-- Prescriptions table - restrict to authenticated users only  
CREATE POLICY "Authenticated users can view prescriptions" 
ON public.prescriptions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert prescriptions" 
ON public.prescriptions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prescriptions" 
ON public.prescriptions 
FOR UPDATE 
TO authenticated
USING (true);

-- Products table - restrict to authenticated users only
CREATE POLICY "Authenticated users can view products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (true);

-- Suppliers table - restrict to authenticated users only
CREATE POLICY "Authenticated users can view suppliers" 
ON public.suppliers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert suppliers" 
ON public.suppliers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers" 
ON public.suppliers 
FOR UPDATE 
TO authenticated
USING (true);

-- Sale items table - restrict to authenticated users only
CREATE POLICY "Authenticated users can view sale_items" 
ON public.sale_items 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sale_items" 
ON public.sale_items 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Stock movements table - restrict to authenticated users only
CREATE POLICY "Authenticated users can view stock_movements" 
ON public.stock_movements 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert stock_movements" 
ON public.stock_movements 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Profiles table policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'pharmacist'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();