-- Create enum for app modules
CREATE TYPE public.app_module AS ENUM (
  'dashboard',
  'dispensing',
  'pos',
  'debtors',
  'stock',
  'reports',
  'management',
  'help'
);

-- Create user_module_permissions table
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module app_module NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, module)
);

-- Enable RLS
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own module permissions"
ON public.user_module_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all module permissions"
ON public.user_module_permissions
FOR SELECT
USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert module permissions"
ON public.user_module_permissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update module permissions"
ON public.user_module_permissions
FOR UPDATE
USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete module permissions"
ON public.user_module_permissions
FOR DELETE
USING (has_role(auth.uid(), 'owner'));

-- Create function to check module access
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module app_module)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Owners always have access to all modules
  SELECT CASE
    WHEN has_role(_user_id, 'owner') THEN true
    -- Otherwise check if user has explicit permission
    ELSE EXISTS (
      SELECT 1
      FROM public.user_module_permissions
      WHERE user_id = _user_id
        AND module = _module
    )
  END
$$;

-- Create function to get user's accessible modules
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid)
RETURNS TABLE(module app_module)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If user is owner, return all modules
  SELECT unnest(ARRAY['dashboard', 'dispensing', 'pos', 'debtors', 'stock', 'reports', 'management', 'help']::app_module[])
  WHERE has_role(_user_id, 'owner')
  UNION
  -- Otherwise return only permitted modules
  SELECT ump.module
  FROM public.user_module_permissions ump
  WHERE ump.user_id = _user_id
$$;

-- Create default permissions for existing users (all modules except management)
INSERT INTO public.user_module_permissions (user_id, module)
SELECT 
  ur.user_id,
  m.module
FROM public.user_roles ur
CROSS JOIN unnest(ARRAY['dashboard', 'dispensing', 'pos', 'debtors', 'stock', 'reports', 'help']::app_module[]) AS m(module)
WHERE ur.role != 'owner' -- Owners don't need explicit permissions
ON CONFLICT (user_id, module) DO NOTHING;