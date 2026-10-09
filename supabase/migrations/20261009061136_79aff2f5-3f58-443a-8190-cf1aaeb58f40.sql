ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_low_demand boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_is_low_demand ON public.products(is_low_demand);