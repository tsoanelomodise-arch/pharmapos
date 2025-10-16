-- Add cash handling columns to sales table
ALTER TABLE public.sales 
ADD COLUMN cash_paid numeric,
ADD COLUMN change_given numeric;