-- Add 'patients' and 'doctors' to the app_module enum
ALTER TYPE app_module ADD VALUE IF NOT EXISTS 'patients';
ALTER TYPE app_module ADD VALUE IF NOT EXISTS 'doctors';