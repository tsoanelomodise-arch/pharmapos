-- Add more sample products for testing prescriptions
INSERT INTO public.products (id, name, generic_name, category, unit_price, cost_price, stock_quantity, minimum_stock, requires_prescription, brand)
VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Aspirin 100mg', 'Acetylsalicylic Acid', 'otc', 45.00, 25.00, 200, 40, false, 'Bayer'),
  ('f2222222-2222-2222-2222-222222222222', 'Paracetamol 500mg', 'Paracetamol', 'otc', 35.00, 18.00, 250, 50, false, 'Panado'),
  ('f3333333-3333-3333-3333-333333333333', 'Ibuprofen 400mg', 'Ibuprofen', 'otc', 55.00, 30.00, 180, 35, false, 'Nurofen'),
  ('f4444444-4444-4444-4444-444444444444', 'Vitamin D3 1000IU', 'Cholecalciferol', 'supplement', 125.00, 70.00, 150, 30, false, 'Solgar'),
  ('f5555555-5555-5555-5555-555555555555', 'Azithromycin 500mg', 'Azithromycin', 'prescription', 185.00, 95.00, 75, 15, true, 'Zithromax')
ON CONFLICT (id) DO NOTHING;

-- Add more diverse prescription samples
INSERT INTO public.prescriptions (customer_id, doctor_name, doctor_license, prescription_date, medications, status, notes)
VALUES 
  (
    '22222222-2222-2222-2222-222222222222',
    'Dr. Sarah Mitchell',
    'MP-6789012',
    CURRENT_DATE,
    '[
      {"product_id": "f5555555-5555-5555-5555-555555555555", "quantity": 1, "unit_price": 185.00},
      {"product_id": "f2222222-2222-2222-2222-222222222222", "quantity": 2, "unit_price": 35.00},
      {"product_id": "f3333333-3333-3333-3333-333333333333", "quantity": 1, "unit_price": 55.00}
    ]'::jsonb,
    'pending',
    'Antibiotic course with pain management. Take antibiotic once daily for 5 days.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Dr. Mohamed Khan',
    'MP-7890123',
    CURRENT_DATE - INTERVAL '1 day',
    '[
      {"product_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "quantity": 3, "unit_price": 145.00},
      {"product_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "quantity": 2, "unit_price": 120.00},
      {"product_id": "f4444444-4444-4444-4444-444444444444", "quantity": 1, "unit_price": 125.00}
    ]'::jsonb,
    'pending',
    'For cholesterol, diabetes, and vitamin supplementation. Take morning with breakfast.'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Dr. Lisa Thompson',
    'MP-8901234',
    CURRENT_DATE,
    '[
      {"product_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "quantity": 3, "unit_price": 85.50},
      {"product_id": "f1111111-1111-1111-1111-111111111111", "quantity": 2, "unit_price": 45.00}
    ]'::jsonb,
    'pending',
    'Antibiotic with low-dose aspirin for post-procedure care. Complete full course.'
  );