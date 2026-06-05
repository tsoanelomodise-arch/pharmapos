-- Update get_user_modules to include new subpage modules for owners
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid)
 RETURNS TABLE(module app_module)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT unnest(ARRAY[
    'dashboard','dispensing','pos','debtors','stock','orders','reports','management',
    'patients','doctors','help','medical_aid','settings','edit_transactions','stock_movement',
    'transactions','suppliers','audit_trail','system_updates','database_status'
  ]::app_module[])
  WHERE has_role(_user_id, 'owner')
  UNION
  SELECT ump.module
  FROM public.user_module_permissions ump
  WHERE ump.user_id = _user_id
$function$;

-- Backfill: users with parent module get the corresponding subpage modules
INSERT INTO public.user_module_permissions (user_id, module)
SELECT user_id, 'transactions'::app_module FROM public.user_module_permissions WHERE module = 'pos'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_module_permissions (user_id, module)
SELECT user_id, 'suppliers'::app_module FROM public.user_module_permissions WHERE module = 'stock'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_module_permissions (user_id, module)
SELECT DISTINCT ump.user_id, 'audit_trail'::app_module
FROM public.user_module_permissions ump
JOIN public.user_roles ur ON ur.user_id = ump.user_id
WHERE ump.module = 'reports' AND ur.role IN ('admin','owner')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_module_permissions (user_id, module)
SELECT user_id, 'system_updates'::app_module FROM public.user_module_permissions WHERE module = 'help'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_module_permissions (user_id, module)
SELECT user_id, 'database_status'::app_module FROM public.user_module_permissions WHERE module = 'help'
ON CONFLICT DO NOTHING;