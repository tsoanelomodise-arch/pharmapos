-- Create business_settings table for pharmacy information used on receipts
CREATE TABLE public.business_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_name text NOT NULL DEFAULT 'Pharmacy',
  address text,
  phone text,
  email text,
  vat_number text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings (needed for receipts)
CREATE POLICY "Authenticated users can view business settings"
ON public.business_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only owners can update settings
CREATE POLICY "Owners can update business settings"
ON public.business_settings
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Only owners can insert settings (for initial setup)
CREATE POLICY "Owners can insert business settings"
ON public.business_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Insert default settings row
INSERT INTO public.business_settings (pharmacy_name) VALUES ('Pharmacy');