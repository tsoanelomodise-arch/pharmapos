-- Remove ALL existing policies and implement secure RLS
-- This fixes the critical security vulnerability where customer PII is publicly accessible

-- Drop ALL existing policies completely (including any that might exist)
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- Create secure RLS policies that require authentication

-- Customers table - restrict to authenticated users only
CREATE POLICY "Auth users can manage customers" 
ON public.customers 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Sales table - restrict to authenticated users only
CREATE POLICY "Auth users can manage sales" 
ON public.sales 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Prescriptions table - restrict to authenticated users only  
CREATE POLICY "Auth users can manage prescriptions" 
ON public.prescriptions 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Products table - restrict to authenticated users only
CREATE POLICY "Auth users can manage products" 
ON public.products 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Suppliers table - restrict to authenticated users only
CREATE POLICY "Auth users can manage suppliers" 
ON public.suppliers 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Sale items table - restrict to authenticated users only
CREATE POLICY "Auth users can manage sale_items" 
ON public.sale_items 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Stock movements table - restrict to authenticated users only
CREATE POLICY "Auth users can manage stock_movements" 
ON public.stock_movements 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);