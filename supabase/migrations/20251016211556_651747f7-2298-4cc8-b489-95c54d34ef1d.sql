-- Insert sample doctors
INSERT INTO public.doctors (name, specialization, license_number, email, phone) VALUES
('Dr. Sarah Mitchell', 'General Practitioner', 'GP-123456', 'sarah.mitchell@medical.com', '+27 11 555 0101'),
('Dr. James Thompson', 'Cardiologist', 'CARD-234567', 'james.thompson@medical.com', '+27 11 555 0102'),
('Dr. Priya Naidoo', 'Pediatrician', 'PED-345678', 'priya.naidoo@medical.com', '+27 11 555 0103'),
('Dr. Michael Chen', 'Dermatologist', 'DERM-456789', 'michael.chen@medical.com', '+27 11 555 0104'),
('Dr. Fatima Al-Rashid', 'Neurologist', 'NEUR-567890', 'fatima.alrashid@medical.com', '+27 11 555 0105'),
('Dr. David Williams', 'Orthopedic Surgeon', 'ORTH-678901', 'david.williams@medical.com', '+27 11 555 0106'),
('Dr. Lisa Anderson', 'Psychiatrist', 'PSY-789012', 'lisa.anderson@medical.com', '+27 11 555 0107'),
('Dr. Ahmed Hassan', 'Endocrinologist', 'ENDO-890123', 'ahmed.hassan@medical.com', '+27 11 555 0108')
ON CONFLICT (id) DO NOTHING;

-- Insert sample patients (customers)
INSERT INTO public.customers (name, phone, email, address, date_of_birth, credit_limit, current_balance) VALUES
('John Williams', '+27 82 555 2001', 'john.williams@email.com', '45 Main Road, Sandton', '1975-04-12', 1000.00, 250.00),
('Mary Johnson', '+27 83 555 2002', 'mary.johnson@email.com', '78 Park Street, Rosebank', '1988-08-23', 750.00, 0.00),
('Peter van der Merwe', '+27 84 555 2003', 'peter.vdm@email.com', '12 Oak Avenue, Pretoria', '1965-11-30', 500.00, 125.50),
('Susan Patel', '+27 85 555 2004', 'susan.patel@email.com', '67 Beach Road, Durban', '1992-03-15', 1500.00, 500.00),
('Thomas Nkosi', '+27 86 555 2005', 'thomas.nkosi@email.com', '23 Garden Street, Soweto', '1980-07-08', 800.00, 0.00),
('Jennifer Brown', '+27 87 555 2006', 'jennifer.brown@email.com', '89 Hill Drive, Cape Town', '1995-12-19', 1200.00, 300.00),
('Robert Smith', '+27 88 555 2007', 'robert.smith@email.com', '34 Valley Road, Port Elizabeth', '1970-02-28', 600.00, 0.00),
('Linda Zulu', '+27 89 555 2008', 'linda.zulu@email.com', '56 Mountain View, Johannesburg', '1985-09-14', 900.00, 150.00),
('Daniel Botha', '+27 82 555 2009', 'daniel.botha@email.com', '91 Lake Street, Bloemfontein', '1993-06-05', 1000.00, 0.00),
('Michelle Ndlovu', '+27 83 555 2010', 'michelle.ndlovu@email.com', '15 River Road, Nelspruit', '1978-01-22', 700.00, 75.00)
ON CONFLICT (id) DO NOTHING;