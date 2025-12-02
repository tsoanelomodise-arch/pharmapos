-- Update the get_user_modules function to include 'orders' for owners
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid)
 RETURNS TABLE(module app_module)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- If user is owner, return all modules including new ones
  SELECT unnest(ARRAY['dashboard', 'dispensing', 'pos', 'debtors', 'stock', 'orders', 'reports', 'management', 'patients', 'doctors', 'help']::app_module[])
  WHERE has_role(_user_id, 'owner')
  UNION
  -- Otherwise return only permitted modules
  SELECT ump.module
  FROM public.user_module_permissions ump
  WHERE ump.user_id = _user_id
$function$;