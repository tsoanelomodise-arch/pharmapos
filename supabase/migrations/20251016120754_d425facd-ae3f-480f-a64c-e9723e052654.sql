-- Insert sample customers for prescriptions
INSERT INTO public.customers (id, name, phone, email, date_of_birth, address)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Sarah Johnson', '+27 82 555 1234', 'sarah.j@email.com', '1985-03-15', '123 Oak Street, Cape Town'),
  ('22222222-2222-2222-2222-222222222222', 'Michael Brown', '+27 83 555 5678', 'mbrown@email.com', '1978-07-22', '456 Pine Avenue, Johannesburg'),
  ('33333333-3333-3333-3333-333333333333', 'Emily Davis', '+27 84 555 9012', 'emily.davis@email.com', '1992-11-08', '789 Maple Road, Durban')
ON CONFLICT (id) DO NOTHING;

-- Insert sample prescription medications (if they don't exist)
INSERT INTO public.products (id, name, generic_name, category, unit_price, cost_price, stock_quantity, minimum_stock, requires_prescription)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amoxicillin 500mg', 'Amoxicillin', 'prescription', 85.50, 45.00, 100, 20, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Metformin 850mg', 'Metformin', 'prescription', 120.00, 65.00, 150, 30, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lisinopril 10mg', 'Lisinopril', 'prescription', 95.00, 50.00, 80, 15, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Omeprazole 20mg', 'Omeprazole', 'prescription', 75.50, 40.00, 120, 25, true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Atorvastatin 20mg', 'Atorvastatin', 'prescription', 145.00, 80.00, 90, 20, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample prescriptions in pending status
INSERT INTO public.prescriptions (customer_id, doctor_name, doctor_license, prescription_date, medications, status, notes)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Dr. Thabo Molefe',
    'MP-2345678',
    CURRENT_DATE,
    '[
      {"product_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "quantity": 2, "unit_price": 85.50},
      {"product_id": "dddddddd-dddd-dddd-dddd-dddddddddddd", "quantity": 1, "unit_price": 75.50}
    ]'::jsonb,
    'pending',
    'Take antibiotics with food. Complete full course.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Dr. Naledi Khumalo',
    'MP-3456789',
    CURRENT_DATE - INTERVAL '1 day',
    '[
      {"product_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "quantity": 3, "unit_price": 120.00},
      {"product_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "quantity": 2, "unit_price": 145.00}
    ]'::jsonb,
    'pending',
    'For diabetes and cholesterol management. Take with evening meal.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Dr. James van Zyl',
    'MP-4567890',
    CURRENT_DATE,
    '[
      {"product_id": "cccccccc-cccc-cccc-cccc-cccccccccccc", "quantity": 2, "unit_price": 95.00}
    ]'::jsonb,
    'pending',
    'For high blood pressure. Take once daily in the morning.'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Dr. Priya Naidoo',
    'MP-5678901',
    CURRENT_DATE - INTERVAL '2 days',
    '[
      {"product_id": "dddddddd-dddd-dddd-dddd-dddddddddddd", "quantity": 2, "unit_price": 75.50},
      {"product_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "quantity": 1, "unit_price": 85.50}
    ]'::jsonb,
    'pending',
    'For acid reflux and infection. Follow dosage instructions carefully.'
  );