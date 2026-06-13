
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS credit_note_for uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credit_reason text;

CREATE INDEX IF NOT EXISTS idx_sales_credit_note_for ON public.sales(credit_note_for);
