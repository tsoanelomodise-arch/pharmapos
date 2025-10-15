-- Skip enum creation if it already exists (from previous migration attempt)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('pharmacist', 'admin', 'manager', 'owner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can manage roles" ON public.user_roles;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only owners can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'owner'
  )
);

-- Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing role data from profiles to user_roles (if profiles.role still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, role::app_role FROM public.profiles
    WHERE role IS NOT NULL
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Drop old policies on customers table
DROP POLICY IF EXISTS "Authorized staff can view patients" ON public.customers;
DROP POLICY IF EXISTS "Authorized staff can create patients" ON public.customers;
DROP POLICY IF EXISTS "Authorized staff can update patients" ON public.customers;
DROP POLICY IF EXISTS "Authorized staff can delete patients" ON public.customers;
DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can create customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can update customers" ON public.customers;
DROP POLICY IF EXISTS "Management can delete customers" ON public.customers;

-- Create new policies for customers
CREATE POLICY "Staff can view customers"
ON public.customers FOR SELECT
USING (
  has_role(auth.uid(), 'pharmacist') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'owner')
);

CREATE POLICY "Staff can create customers"
ON public.customers FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'pharmacist') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'owner')
);

CREATE POLICY "Staff can update customers"
ON public.customers FOR UPDATE
USING (
  has_role(auth.uid(), 'pharmacist') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'owner')
);

CREATE POLICY "Management can delete customers"
ON public.customers FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'owner')
);

-- Update profiles policies
DROP POLICY IF EXISTS "Authorized staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Management can view all profiles" ON public.profiles;

CREATE POLICY "Management can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'owner')
);

-- Fix suppliers table security vulnerability
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Management can manage suppliers" ON public.suppliers;

CREATE POLICY "Management can manage suppliers"
ON public.suppliers FOR ALL
USING (
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'owner')
);

-- Drop the old get_current_user_role function
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Update trigger function to assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default pharmacist role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'pharmacist');
  
  RETURN NEW;
END;
$$;

-- Drop role column from profiles (after data migration)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;