-- Insert 5 sample cash transactions with change calculations

-- Transaction 1: Small purchase, customer pays R10 for R7.50 item
INSERT INTO public.sales (id, total_amount, tax_amount, discount_amount, payment_method, payment_status, cash_paid, change_given, notes, created_at)
VALUES (
  gen_random_uuid(),
  8.63, -- R7.50 + 15% VAT
  1.13,
  0,
  'cash',
  'completed',
  10.00,
  1.37,
  'Sample cash sale - Cough Syrup',
  now() - interval '2 hours'
);

INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT 
  (SELECT id FROM public.sales WHERE notes = 'Sample cash sale - Cough Syrup'),
  'aa0cde40-cf0b-49b0-af5e-8473ed8c625c'::uuid,
  1,
  7.50,
  7.50;

-- Transaction 2: Medium purchase, customer pays R50 for R28.99 item
INSERT INTO public.sales (id, total_amount, tax_amount, discount_amount, payment_method, payment_status, cash_paid, change_given, notes, created_at)
VALUES (
  gen_random_uuid(),
  33.34, -- R28.99 + 15% VAT
  4.35,
  0,
  'cash',
  'completed',
  50.00,
  16.66,
  'Sample cash sale - Lisinopril',
  now() - interval '1 hour 30 minutes'
);

INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT 
  (SELECT id FROM public.sales WHERE notes = 'Sample cash sale - Lisinopril'),
  '2566c5ad-e0f8-4eed-b28e-9c31b1da56f0'::uuid,
  1,
  28.99,
  28.99;

-- Transaction 3: Multiple items, customer pays R100 for R81.38 total
INSERT INTO public.sales (id, total_amount, tax_amount, discount_amount, payment_method, payment_status, cash_paid, change_given, notes, created_at)
VALUES (
  gen_random_uuid(),
  81.38, -- (R45.99 + R22.99 + R1.75) + 15% VAT
  10.62,
  0,
  'cash',
  'completed',
  100.00,
  18.62,
  'Sample cash sale - Multiple items',
  now() - interval '1 hour'
);

INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT 
  (SELECT id FROM public.sales WHERE notes = 'Sample cash sale - Multiple items'),
  product_id,
  quantity,
  unit_price,
  total_price
FROM (VALUES
  ('26a8bf17-8403-4959-86e1-27232663532b'::uuid, 1, 45.99, 45.99),
  ('e1a464ec-f152-42e5-9e59-18af67580e83'::uuid, 1, 22.99, 22.99),
  ('a773a278-993d-4e39-8802-53804659b675'::uuid, 1, 1.75, 1.75)
) AS items(product_id, quantity, unit_price, total_price);

-- Transaction 4: Small amount, customer pays R20 for R3.74
INSERT INTO public.sales (id, total_amount, tax_amount, discount_amount, payment_method, payment_status, cash_paid, change_given, notes, created_at)
VALUES (
  gen_random_uuid(),
  3.74, -- R3.25 + 15% VAT
  0.49,
  0,
  'cash',
  'completed',
  20.00,
  16.26,
  'Sample cash sale - Ibuprofen 400mg',
  now() - interval '30 minutes'
);

INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT 
  (SELECT id FROM public.sales WHERE notes = 'Sample cash sale - Ibuprofen 400mg'),
  'd584d381-4979-489e-802e-77e8586ed893'::uuid,
  1,
  3.25,
  3.25;

-- Transaction 5: Larger purchase with multiple quantities, customer pays R200 for R159.75
INSERT INTO public.sales (id, total_amount, tax_amount, discount_amount, payment_method, payment_status, cash_paid, change_given, notes, created_at)
VALUES (
  gen_random_uuid(),
  159.75, -- (R15.99*3 + R15.00*2 + R12.50*3) + 15% VAT
  20.81,
  0,
  'cash',
  'completed',
  200.00,
  40.25,
  'Sample cash sale - Bulk purchase',
  now() - interval '15 minutes'
);

INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT 
  (SELECT id FROM public.sales WHERE notes = 'Sample cash sale - Bulk purchase'),
  product_id,
  quantity,
  unit_price,
  total_price
FROM (VALUES
  ('fae944ea-34fd-47ce-b958-a1d6de3e71c1'::uuid, 3, 15.99, 47.97),
  ('a7cbe62d-e37b-4dc5-8b4c-44f285af94f6'::uuid, 2, 15.00, 30.00),
  ('94469c6d-88f7-49d2-bbcf-3690cf6201d8'::uuid, 3, 12.50, 37.50)
) AS items(product_id, quantity, unit_price, total_price);