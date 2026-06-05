
-- 1. Table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_name text,
  actor_role app_role,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  summary text,
  changes jsonb
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_user_id);

-- 2. Grants — read-only via API; writes only via SECURITY DEFINER trigger
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- 3. RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- No INSERT/UPDATE/DELETE policies => blocked from API entirely.

-- 4. Trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_actor_role app_role;
  v_entity text := TG_TABLE_NAME;
  v_entity_id uuid;
  v_action text := TG_OP;
  v_summary text;
  v_before jsonb;
  v_after jsonb;
  v_diff_keys text[] := ARRAY[]::text[];
  v_changes jsonb;
  k text;
BEGIN
  -- Actor info
  IF v_actor IS NOT NULL THEN
    SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = v_actor;
    SELECT role INTO v_actor_role FROM public.user_roles WHERE user_id = v_actor LIMIT 1;
  END IF;

  -- Entity id + before/after
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_entity_id := (v_before->>'id')::uuid;
  ELSIF TG_OP = 'INSERT' THEN
    v_after := to_jsonb(NEW);
    v_entity_id := (v_after->>'id')::uuid;
  ELSE -- UPDATE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_entity_id := (v_after->>'id')::uuid;
    -- Compute diff keys
    FOR k IN SELECT jsonb_object_keys(v_after) LOOP
      IF (v_before->k) IS DISTINCT FROM (v_after->k)
         AND k NOT IN ('updated_at') THEN
        v_diff_keys := array_append(v_diff_keys, k);
      END IF;
    END LOOP;
    -- Skip if nothing meaningful changed
    IF array_length(v_diff_keys, 1) IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Build summary per table
  v_summary := CASE v_entity
    WHEN 'sales' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Created sale #' || upper(right(v_entity_id::text, 8)) || ' total R' || coalesce((v_after->>'total_amount'),'0')
        WHEN 'UPDATE' THEN 'Edited sale #' || upper(right(v_entity_id::text, 8))
        ELSE 'Deleted sale #' || upper(right(v_entity_id::text, 8))
      END
    WHEN 'sale_items' THEN 'Sale item ' || lower(TG_OP) || 'd on sale #' || upper(right(coalesce(v_after->>'sale_id', v_before->>'sale_id'),8))
    WHEN 'prescriptions' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Created prescription for Dr. ' || coalesce(v_after->>'doctor_name','?')
        WHEN 'UPDATE' THEN
          CASE WHEN (v_before->>'status') IS DISTINCT FROM (v_after->>'status')
               THEN 'Prescription status: ' || coalesce(v_before->>'status','?') || ' → ' || coalesce(v_after->>'status','?')
               ELSE 'Edited prescription' END
        ELSE 'Deleted prescription'
      END
    WHEN 'products' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Created product: ' || coalesce(v_after->>'name','?')
        WHEN 'UPDATE' THEN
          CASE WHEN (v_before->>'stock_quantity') IS DISTINCT FROM (v_after->>'stock_quantity')
               THEN 'Stock changed for ' || coalesce(v_after->>'name','?') || ': ' || (v_before->>'stock_quantity') || ' → ' || (v_after->>'stock_quantity')
               ELSE 'Edited product: ' || coalesce(v_after->>'name','?') END
        ELSE 'Deleted product: ' || coalesce(v_before->>'name','?')
      END
    WHEN 'customers' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Created patient: ' || coalesce(v_after->>'name','?')
        WHEN 'UPDATE' THEN 'Edited patient: ' || coalesce(v_after->>'name','?')
        ELSE 'Deleted patient: ' || coalesce(v_before->>'name','?')
      END
    WHEN 'doctors' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Created doctor: ' || coalesce(v_after->>'name','?')
        WHEN 'UPDATE' THEN 'Edited doctor: ' || coalesce(v_after->>'name','?')
        ELSE 'Deleted doctor: ' || coalesce(v_before->>'name','?')
      END
    WHEN 'suppliers' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Created supplier: ' || coalesce(v_after->>'name','?')
        WHEN 'UPDATE' THEN 'Edited supplier: ' || coalesce(v_after->>'name','?')
        ELSE 'Deleted supplier: ' || coalesce(v_before->>'name','?')
      END
    WHEN 'user_roles' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Granted role ' || coalesce(v_after->>'role','?')
        WHEN 'UPDATE' THEN 'Changed role to ' || coalesce(v_after->>'role','?')
        ELSE 'Revoked role ' || coalesce(v_before->>'role','?')
      END
    WHEN 'user_module_permissions' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN 'Granted module access: ' || coalesce(v_after->>'module','?')
        ELSE 'Revoked module access: ' || coalesce(v_before->>'module','?')
      END
    WHEN 'business_settings' THEN 'Updated business settings'
    WHEN 'profiles' THEN 'Updated profile: ' || coalesce(v_after->>'full_name', v_after->>'email', '?')
    ELSE TG_OP || ' on ' || v_entity
  END;

  v_changes := jsonb_build_object(
    'before', v_before,
    'after', v_after,
    'diff_keys', to_jsonb(v_diff_keys)
  );

  INSERT INTO public.audit_logs (
    actor_user_id, actor_name, actor_role,
    action, entity_type, entity_id, summary, changes
  ) VALUES (
    v_actor, v_actor_name, v_actor_role,
    v_action, v_entity, v_entity_id, v_summary, v_changes
  );

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  -- Never let audit failures break user actions
  RETURN NULL;
END;
$$;

-- 5. Attach triggers
CREATE TRIGGER trg_audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_sale_items AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_doctors AFTER INSERT OR UPDATE OR DELETE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_user_module_permissions AFTER INSERT OR UPDATE OR DELETE ON public.user_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_business_settings AFTER INSERT OR UPDATE OR DELETE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_profiles AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
