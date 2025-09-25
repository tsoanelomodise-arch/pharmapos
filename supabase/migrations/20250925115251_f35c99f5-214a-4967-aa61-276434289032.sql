-- Insert more comprehensive sample data

-- Add more products
INSERT INTO products (name, generic_name, brand, category, barcode, description, unit_price, cost_price, stock_quantity, minimum_stock, expiry_date, batch_number, requires_prescription) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Panadol', 'otc', '1234567890123', 'Pain relief and fever reducer', 2.50, 1.50, 150, 20, '2025-12-31', 'PAR001', false),
('Amoxicillin 250mg', 'Amoxicillin', 'Amoxil', 'prescription', '2345678901234', 'Antibiotic for bacterial infections', 8.75, 6.25, 80, 15, '2025-06-30', 'AMX001', true),
('Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 'otc', '3456789012345', 'Anti-inflammatory pain relief', 3.25, 2.00, 120, 25, '2025-11-15', 'IBU001', false),
('Omeprazole 20mg', 'Omeprazole', 'Losec', 'prescription', '4567890123456', 'Proton pump inhibitor for acid reflux', 12.50, 9.00, 60, 10, '2025-08-20', 'OME001', true),
('Vitamin D3 1000IU', 'Cholecalciferol', 'VitaD', 'supplement', '5678901234567', 'Vitamin D supplement', 15.00, 10.50, 90, 15, '2026-03-15', 'VIT001', false),
('Cough Syrup', 'Dextromethorphan', 'Robitussin', 'otc', '6789012345678', 'Cough suppressant syrup', 7.50, 5.25, 45, 8, '2025-09-30', 'COU001', false),
('Metformin 500mg', 'Metformin', 'Glucophage', 'prescription', '7890123456789', 'Diabetes medication', 6.75, 4.50, 100, 20, '2025-10-25', 'MET001', true),
('Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 'otc', '8901234567890', 'Antihistamine for allergies', 4.25, 2.75, 75, 12, '2025-12-10', 'CET001', false),
('Hand Sanitizer 500ml', 'Ethyl Alcohol', 'SafeHands', 'medical_device', '9012345678901', 'Antibacterial hand sanitizer', 8.00, 5.50, 200, 30, '2026-01-15', 'SAN001', false),
('Face Moisturizer', 'Hyaluronic Acid', 'GlowSkin', 'cosmetic', '0123456789012', 'Hydrating face moisturizer', 22.50, 15.00, 35, 5, '2025-07-30', 'MOI001', false);

-- Add more customers
INSERT INTO customers (name, phone, email, address, date_of_birth, credit_limit, current_balance) VALUES
('Ahmed Hassan', '+971501234567', 'ahmed.hassan@email.com', '123 Sheikh Zayed Road, Dubai', '1985-03-15', 500.00, 0.00),
('Fatima Al-Zahra', '+971502345678', 'fatima.alzahra@email.com', '456 Marina Walk, Dubai', '1990-07-22', 750.00, 125.50),
('Mohamed Ali', '+971503456789', 'mohamed.ali@email.com', '789 Business Bay, Dubai', '1978-11-08', 1000.00, 0.00),
('Aisha Abdullah', '+971504567890', 'aisha.abdullah@email.com', '321 Jumeirah Beach Road, Dubai', '1992-05-12', 300.00, 45.75),
('Omar Khalil', '+971505678901', 'omar.khalil@email.com', '654 Al Barsha, Dubai', '1988-09-18', 600.00, 0.00),
('Layla Mansour', '+971506789012', 'layla.mansour@email.com', '987 Downtown Dubai', '1995-02-28', 400.00, 87.25),
('Youssef Ibrahim', '+971507890123', 'youssef.ibrahim@email.com', '147 Deira City Centre, Dubai', '1982-12-05', 800.00, 0.00),
('Mariam Said', '+971508901234', 'mariam.said@email.com', '258 Bur Dubai, Dubai', '1993-08-14', 350.00, 62.50);

-- Add some sales transactions
INSERT INTO sales (customer_id, total_amount, discount_amount, tax_amount, payment_method, notes) VALUES
((SELECT id FROM customers WHERE name = 'Ahmed Hassan'), 25.75, 2.00, 3.56, 'cash', 'Regular customer purchase'),
((SELECT id FROM customers WHERE name = 'Fatima Al-Zahra'), 87.50, 5.00, 12.38, 'card', 'Prescription medicines'),
((SELECT id FROM customers WHERE name = 'Mohamed Ali'), 15.25, 0.00, 2.29, 'cash', 'OTC medications'),
((SELECT id FROM customers WHERE name = 'Aisha Abdullah'), 45.75, 3.00, 6.41, 'credit', 'Monthly medications'),
((SELECT id FROM customers WHERE name = 'Layla Mansour'), 33.50, 1.50, 4.80, 'card', 'Vitamins and supplements');

-- Add sale items for these transactions
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT s.id, p.id, 2, p.unit_price, (2 * p.unit_price)
FROM sales s, products p
WHERE s.customer_id = (SELECT id FROM customers WHERE name = 'Ahmed Hassan')
AND p.name = 'Paracetamol 500mg'
LIMIT 1;

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT s.id, p.id, 1, p.unit_price, p.unit_price
FROM sales s, products p
WHERE s.customer_id = (SELECT id FROM customers WHERE name = 'Fatima Al-Zahra')
AND p.name = 'Amoxicillin 250mg'
LIMIT 1;

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT s.id, p.id, 3, p.unit_price, (3 * p.unit_price)
FROM sales s, products p
WHERE s.customer_id = (SELECT id FROM customers WHERE name = 'Mohamed Ali')
AND p.name = 'Ibuprofen 400mg'
LIMIT 1;

-- Add prescriptions
INSERT INTO prescriptions (customer_id, doctor_name, doctor_license, prescription_date, medications, status, notes) VALUES
((SELECT id FROM customers WHERE name = 'Ahmed Hassan'), 'Dr. Sarah Al-Mansoori', 'DXB12345', '2025-01-10', 
 '[{"name": "Amoxicillin 250mg", "dosage": "250mg", "frequency": "3 times daily", "duration": "7 days"}]', 
 'pending', 'Patient has penicillin allergy - confirmed safe'),
((SELECT id FROM customers WHERE name = 'Fatima Al-Zahra'), 'Dr. Khalid Rahman', 'DXB67890', '2025-01-08', 
 '[{"name": "Omeprazole 20mg", "dosage": "20mg", "frequency": "Once daily", "duration": "30 days"}]', 
 'dispensed', 'For acid reflux treatment'),
((SELECT id FROM customers WHERE name = 'Mohamed Ali'), 'Dr. Amina Hassan', 'DXB11111', '2025-01-12', 
 '[{"name": "Metformin 500mg", "dosage": "500mg", "frequency": "Twice daily", "duration": "90 days"}]', 
 'pending', 'Diabetes management - monitor blood sugar'),
((SELECT id FROM customers WHERE name = 'Aisha Abdullah'), 'Dr. Omar Al-Zahra', 'DXB22222', '2025-01-09', 
 '[{"name": "Cetirizine 10mg", "dosage": "10mg", "frequency": "Once daily", "duration": "14 days"}]', 
 'dispensed', 'Seasonal allergies');

-- Add stock movements
INSERT INTO stock_movements (product_id, movement_type, quantity, notes) VALUES
((SELECT id FROM products WHERE name = 'Paracetamol 500mg'), 'adjustment', -2, 'Sale to Ahmed Hassan'),
((SELECT id FROM products WHERE name = 'Amoxicillin 250mg'), 'sale', -1, 'Prescription dispensed'),
((SELECT id FROM products WHERE name = 'Ibuprofen 400mg'), 'sale', -3, 'OTC sale'),
((SELECT id FROM products WHERE name = 'Vitamin D3 1000IU'), 'adjustment', 50, 'New stock received'),
((SELECT id FROM products WHERE name = 'Hand Sanitizer 500ml'), 'adjustment', 100, 'Bulk purchase');