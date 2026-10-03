-- Ensure stock_quantity cannot be negative
UPDATE public.products 
SET stock_quantity = 0 
WHERE stock_quantity < 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_quantity_non_negative'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0);
  END IF;
END $$;
