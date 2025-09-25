-- Fix critical security vulnerability: Customer data exposed to public
-- Drop the existing permissive RLS policy on customers table
DROP POLICY IF EXISTS "Auth users can manage customers" ON public.customers;

-- Create secure RLS policies for customers table that require authentication
CREATE POLICY "Authenticated users can view customers" ON public.customers
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert customers" ON public.customers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customers" ON public.customers
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customers" ON public.customers
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix profiles table missing RLS policies
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure all other sensitive tables have proper authentication requirements
-- Update any remaining permissive policies

-- Prescriptions table
DROP POLICY IF EXISTS "Auth users can manage prescriptions" ON public.prescriptions;
CREATE POLICY "Authenticated users can view prescriptions" ON public.prescriptions
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert prescriptions" ON public.prescriptions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prescriptions" ON public.prescriptions
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete prescriptions" ON public.prescriptions
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Products table
DROP POLICY IF EXISTS "Auth users can manage products" ON public.products;
CREATE POLICY "Authenticated users can view products" ON public.products
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert products" ON public.products
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products" ON public.products
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete products" ON public.products
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sales table
DROP POLICY IF EXISTS "Auth users can manage sales" ON public.sales;
CREATE POLICY "Authenticated users can view sales" ON public.sales
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sales" ON public.sales
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sales" ON public.sales
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sales" ON public.sales
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sale items table
DROP POLICY IF EXISTS "Auth users can manage sale_items" ON public.sale_items;
CREATE POLICY "Authenticated users can view sale_items" ON public.sale_items
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sale_items" ON public.sale_items
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sale_items" ON public.sale_items
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Stock movements table  
DROP POLICY IF EXISTS "Auth users can manage stock_movements" ON public.stock_movements;
CREATE POLICY "Authenticated users can view stock_movements" ON public.stock_movements
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert stock_movements" ON public.stock_movements
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update stock_movements" ON public.stock_movements
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete stock_movements" ON public.stock_movements
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Suppliers table
DROP POLICY IF EXISTS "Auth users can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers
FOR DELETE USING (auth.uid() IS NOT NULL);