-- Add processed_by field to sales table to track who processed each sale
ALTER TABLE public.sales 
ADD COLUMN processed_by UUID REFERENCES auth.users(id);

-- Add dispensed_by field to prescriptions table to track who dispensed each prescription
ALTER TABLE public.prescriptions 
ADD COLUMN dispensed_by UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX idx_sales_processed_by ON public.sales(processed_by);
CREATE INDEX idx_prescriptions_dispensed_by ON public.prescriptions(dispensed_by);