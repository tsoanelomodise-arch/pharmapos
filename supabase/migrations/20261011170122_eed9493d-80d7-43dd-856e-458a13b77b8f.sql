ALTER TABLE public.products RENAME COLUMN is_low_demand TO is_high_demand;
UPDATE public.products SET is_high_demand = false;
ALTER INDEX IF EXISTS public.idx_products_is_low_demand RENAME TO idx_products_is_high_demand;