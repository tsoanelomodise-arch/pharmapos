-- Add markup_percentage column to products table
ALTER TABLE public.products 
ADD COLUMN markup_percentage numeric NOT NULL DEFAULT 0;