BEGIN;

-- Table: restock_records
CREATE TABLE public.restock_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text,
  invoice_number text,
  delivery_note_number text,
  invoice_file_path text,
  delivery_note_file_path text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.restock_records TO authenticated;
GRANT ALL ON public.restock_records TO service_role;

ALTER TABLE public.restock_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restock creators can insert records"
  ON public.restock_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'restock') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Creator and management can view restock records"
  ON public.restock_records
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Restock records are immutable"
  ON public.restock_records
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Restock records cannot be deleted"
  ON public.restock_records
  FOR DELETE
  TO authenticated
  USING (false);

-- Link stock movements to restock records
ALTER TABLE public.stock_movements
  ADD COLUMN restock_record_id uuid REFERENCES public.restock_records(id) ON DELETE SET NULL;

-- Table: restock_alert_log
CREATE TABLE public.restock_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient_count integer NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT ON public.restock_alert_log TO authenticated;
GRANT ALL ON public.restock_alert_log TO service_role;

ALTER TABLE public.restock_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management can view alert log"
  ON public.restock_alert_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Management can insert alert log"
  ON public.restock_alert_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  );

-- Triggers for restock_records
CREATE TRIGGER update_restock_records_updated_at
  BEFORE UPDATE ON public.restock_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_audit_restock_records
  AFTER INSERT OR UPDATE OR DELETE ON public.restock_records
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_event();

-- Additional policies so the restock role can perform replenishment
CREATE POLICY "Restock role can view products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'restock'));

CREATE POLICY "Restock role can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'restock'))
  WITH CHECK (public.has_role(auth.uid(), 'restock'));

CREATE POLICY "Restock role can view stock_movements"
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'restock'));

CREATE POLICY "Restock role can insert stock_movements"
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'restock'));

COMMIT;