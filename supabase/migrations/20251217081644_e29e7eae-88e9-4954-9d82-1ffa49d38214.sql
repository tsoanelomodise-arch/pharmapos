-- Add stock_movement to app_module enum
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'stock_movement';