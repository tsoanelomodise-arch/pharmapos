-- Create junction table for many-to-many product-supplier relationship
CREATE TABLE public.product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  cost_price NUMERIC DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view product_suppliers"
ON public.product_suppliers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert product_suppliers"
ON public.product_suppliers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product_suppliers"
ON public.product_suppliers FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product_suppliers"
ON public.product_suppliers FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_product_suppliers_updated_at
BEFORE UPDATE ON public.product_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing supplier_id data from products table to junction table
INSERT INTO public.product_suppliers (product_id, supplier_id, is_primary)
SELECT id, supplier_id, true
FROM public.products
WHERE supplier_id IS NOT NULL;

-- Remove the old supplier_id column from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS supplier_id;