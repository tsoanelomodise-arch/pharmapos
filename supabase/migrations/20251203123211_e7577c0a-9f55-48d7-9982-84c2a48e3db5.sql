-- Add VAT settings columns to business_settings table
ALTER TABLE public.business_settings
ADD COLUMN vat_rate numeric NOT NULL DEFAULT 15.00,
ADD COLUMN vat_inclusive boolean NOT NULL DEFAULT false;