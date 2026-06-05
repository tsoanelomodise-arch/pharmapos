-- Add new subpage modules to app_module enum
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'transactions';
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'suppliers';
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'audit_trail';
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'system_updates';
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'database_status';