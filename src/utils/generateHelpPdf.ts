import jsPDF from 'jspdf';

export const generateHelpPdf = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addTitle = (text: string, fontSize: number = 18) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += fontSize * 0.5 + 4;
  };

  const addSubtitle = (text: string, fontSize: number = 14) => {
    checkPageBreak(20);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += fontSize * 0.4 + 3;
  };

  const addText = (text: string, fontSize: number = 10, indent: number = 0) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(8);
      doc.text(line, margin + indent, y);
      y += 5;
    });
  };

  const addListItem = (text: string, bullet: string = '•', indent: number = 5) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent - 5);
    doc.text(bullet, margin + indent, y);
    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + indent + 5, y);
      if (index < lines.length - 1) {
        y += 5;
        checkPageBreak(8);
      }
    });
    y += 5;
  };

  const addSpacer = (height: number = 5) => {
    y += height;
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Title Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PharmaPos', pageWidth / 2, 60, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Help & User Manual', pageWidth / 2, 75, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Pharmacy Management System', pageWidth / 2, 90, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Powered by: The Wonderland Studio', pageWidth / 2, 105, { align: 'center' });
  
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Generated: ${today}`, pageWidth / 2, 120, { align: 'center' });

  // Define section anchors for internal links
  const sections = [
    { id: 'quick-start', title: '1. Quick Start Guide', page: 3 },
    { id: 'user-roles', title: '2. User Roles & Permissions', page: 3 },
    { id: 'module-permissions', title: '3. Module Permissions System', page: 4 },
    { id: 'dashboard', title: '4. Dashboard Overview', page: 5 },
    { id: 'dispensing', title: '5. Dispensing Prescriptions', page: 6 },
    { id: 'pos', title: '6. Point of Sale (POS)', page: 7 },
    { id: 'debtors', title: '7. Debtors Management', page: 8 },
    { id: 'stock', title: '8. Stock Management', page: 9 },
    { id: 'reports', title: '9. Reports', page: 10 },
    { id: 'admin', title: '10. Admin Module', page: 11 },
    { id: 'mobile', title: '11. Mobile & Tablet Support', page: 12 },
    { id: 'getting-help', title: '12. Getting Help', page: 12 },
  ];

  // Table of Contents
  doc.addPage();
  y = 20;
  addTitle('Table of Contents', 16);
  addSpacer(5);
  
  const tocStartY = y;
  sections.forEach((section, index) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 51, 153); // Blue color for links
    const linkY = tocStartY + index * 8;
    doc.textWithLink(section.title, margin, linkY, { pageNumber: section.page });
    doc.setTextColor(0, 0, 0); // Reset to black
  });
  y = tocStartY + sections.length * 8 + 10;

  // Quick Start Guide
  doc.addPage();
  y = 20;
  addTitle('1. Quick Start Guide');
  addText('Get started with PharmaPos in minutes:');
  addSpacer(5);
  addListItem('Step 1: Login - Use your credentials provided by the administrator');
  addListItem('Step 2: Dashboard - Review today\'s metrics and alerts');
  addListItem('Step 3: Navigate - Use the sidebar to access modules');
  addListItem('Step 4: Work - Dispense, sell, or manage as needed');

  // User Roles & Permissions
  addSpacer(10);
  addTitle('2. User Roles & Permissions');
  addText('Understanding access levels in the system:');
  addSpacer(5);

  addSubtitle('Pharmacist', 12);
  addText('Day-to-day dispensing and sales operations');
  addListItem('Access to assigned modules only');
  addListItem('Dispense prescriptions');
  addListItem('Process sales (POS)');
  addListItem('View stock, cost pricing & supplier data');
  addListItem('Cannot view Recent Transactions or edit Transaction History');
  addListItem('Cannot delete prescriptions from queue');
  addListItem('No management or user administration');
  addSpacer(5);

  addSubtitle('Admin', 12);
  addText('Extended access for administrative tasks');
  addListItem('All module access (if assigned)');
  addListItem('Manage patients & doctors');
  addListItem('Create & manage user accounts');
  addListItem('Assign user roles');
  addListItem('View & edit completed transactions');
  addListItem('Delete prescriptions from queue');
  addListItem('Cannot set module permissions');
  addSpacer(5);

  addSubtitle('Cashier', 12);
  addText('Financial data access for cashier operations');
  addListItem('Access to assigned modules');
  addListItem('View cost pricing');
  addListItem('View supplier data');
  addListItem('Financial reports access');
  addListItem('No user management');
  addListItem('Cannot set module permissions');
  addSpacer(5);

  addSubtitle('Restock', 12);
  addText('Remote stock replenishment and supplier document capture');
  addListItem('Access to assigned modules');
  addListItem('Replenish stock from low-stock alerts');
  addListItem('Capture supplier, invoice and delivery-note details');
  addListItem('Upload invoice and delivery-note files');
  addListItem('View restock history and download documents');
  addListItem('No user management');
  addListItem('Cannot set module permissions');
  addSpacer(5);

  addSubtitle('Owner', 12);
  addText('Complete system control including permissions');
  addListItem('Full system access');
  addListItem('Create & manage all users');
  addListItem('Set module permissions');
  addListItem('View all financial data');
  addListItem('Edit completed transactions & delete prescriptions');
  addListItem('Delete user accounts');
  addListItem('Full system configuration');

  // Module Permissions System
  doc.addPage();
  y = 20;
  addTitle('3. Module Permissions System');
  addText('How access to different system modules is controlled:');
  addSpacer(5);
  addText('Each user is assigned specific modules they can access. This is controlled by the Owner through the Module Permissions section in Admin. Users will only see navigation items and can only access pages for modules they have been granted permission to.');
  addSpacer(5);
  addSubtitle('Available Modules:', 12);
  addListItem('Dashboard - Main overview and metrics');
  addListItem('Dispensing - Prescription processing');
  addListItem('POS & Sales - Point of sale transactions');
  addListItem('Debtors - Customer account management');
  addListItem('Stock Control - Inventory management');
  addListItem('Reports - Business analytics');
  addListItem('Admin - System administration');
  addListItem('Patients - Patient records');
  addListItem('Doctors - Doctor directory');
  addListItem('Help - User manual and support');
  addSpacer(5);
  addSubtitle('Important Notes:', 12);
  addListItem('Only Owners can modify module permissions');
  addListItem('Users cannot access modules they don\'t have permission for');
  addListItem('Direct URL access to restricted modules will redirect users');
  addListItem('Owners automatically have access to all modules');

  // Dashboard Overview
  doc.addPage();
  y = 20;
  addTitle('4. Dashboard Overview');
  addSubtitle('What you\'ll see:', 12);
  addListItem('Total Sales: Today\'s revenue and sales count');
  addListItem('Prescriptions: Number of prescriptions dispensed today');
  addListItem('Low Stock Alerts: Products that need reordering');
  addListItem('Patient Visits: Number of unique patients served');
  addListItem('Recent Activity: Latest transactions and prescriptions');
  addSpacer(5);
  addSubtitle('How to use:', 12);
  addListItem('Check the dashboard upon login to review daily metrics', '1.');
  addListItem('Monitor low stock alerts and reorder products as needed', '2.');
  addListItem('Review recent sales and prescription activity', '3.');
  addListItem('Click on any metric card for detailed information', '4.');
  addListItem('Click the logo to return to dashboard from any page', '5.');

  // Dispensing Prescriptions
  doc.addPage();
  y = 20;
  addTitle('5. Dispensing Prescriptions');
  addSubtitle('How to dispense a prescription:', 12);
  addListItem('Create New Prescription: Click "New Prescription" button', '1.');
  addListItem('Select Patient: Search by typing patient name, phone, or email', '2.');
  addListItem('Enter Doctor Information: Search by doctor name, license number, or specialization', '3.');
  addListItem('Add Medications: Search and add prescribed medications with dosage form, frequency, duration, and quantity', '4.');
  addListItem('Save Prescription: Click "Save" to create the prescription', '5.');
  addListItem('Dispense: Click "Dispense" to process and proceed to payment', '6.');
  addListItem('Print Labels: Print medicine labels for each medication', '7.');
  addSpacer(5);
  addSubtitle('Prescription Queue:', 12);
  addListItem('Prescriptions are sorted by date (latest first)');
  addListItem('Filter by status: Pending, Dispensed, or All');
  addListItem('Search by patient name or doctor');
  addListItem('Stock quantities are automatically decremented when dispensed');

  // Point of Sale
  doc.addPage();
  y = 20;
  addTitle('6. Point of Sale (POS)');
  addSubtitle('How to process a sale:', 12);
  addListItem('Search Products: Use the search bar to find items', '1.');
  addListItem('Scan Barcode: Or scan product barcodes directly', '2.');
  addListItem('Add to Cart: Click on products to add them to the cart', '3.');
  addListItem('Adjust Quantity: Modify quantities as needed', '4.');
  addListItem('Select Customer (Optional): Link sale to a customer account', '5.');
  addListItem('Choose Payment Method: Select Cash, Card, or Credit', '6.');
  addListItem('Process Payment: Click "Complete Sale"', '7.');
  addListItem('Print Receipt: Receipt is generated automatically', '8.');
  addSpacer(5);
  addSubtitle('Payment Methods:', 12);
  addListItem('Cash: Enter amount paid, change calculated automatically');
  addListItem('Card: Process card payment');
  addListItem('Credit: Add to customer\'s account (requires customer selection)');
  addSpacer(5);
  addSubtitle('Prescription Integration:', 12);
  addListItem('When dispensing prescriptions, medications auto-populate the cart');
  addListItem('Product details, prices, and quantities are pre-filled');
  addListItem('Review and adjust quantities before completing the sale');

  // Debtors Management
  doc.addPage();
  y = 20;
  addTitle('7. Debtors Management');
  addSubtitle('Managing customer accounts:', 12);
  addListItem('View Debtors: See list of customers with outstanding balances', '1.');
  addListItem('Search Customers: Find specific customer accounts', '2.');
  addListItem('View Account Details: Click on customer to see transaction history', '3.');
  addListItem('Process Payments: Record payments received from customers', '4.');
  addListItem('View Statements: Generate and print customer statements', '5.');
  addSpacer(5);
  addSubtitle('Important Notes:', 12);
  addListItem('Credit limits are set per customer');
  addListItem('System prevents sales exceeding credit limits');
  addListItem('Regular statements should be sent to customers');
  addListItem('Monitor aging of accounts receivable');

  // Stock Management
  doc.addPage();
  y = 20;
  addTitle('8. Stock Management');
  addSubtitle('Managing inventory:', 12);
  addListItem('View Stock: See all products in inventory', '1.');
  addListItem('Add Product: Click "Add Product" and fill in details', '2.');
  addListItem('Update Stock: Edit existing products to update quantities', '3.');
  addListItem('Monitor Alerts: Check low stock and expiry warnings', '4.');
  addListItem('Stock Report: Generate comprehensive inventory reports', '5.');
  addSpacer(5);
  addSubtitle('Product Fields Guide:', 12);
  addListItem('Product Name: Name as shown on packaging (e.g., Panado 500mg Tablets)');
  addListItem('Generic Name: Active ingredient name (e.g., Paracetamol)');
  addListItem('Brand: Manufacturer or brand name (e.g., Adcock Ingram)');
  addListItem('Category: Type of product - Prescription, OTC, Supplement, Medical Device, Cosmetic (e.g., OTC)');
  addListItem('Barcode: Scannable product code (e.g., 6001505012345)');
  addListItem('Description: Additional product details (e.g., 24 tablets per pack, sugar-free)');
  addListItem('Unit Price: Customer selling price (e.g., R45.99)');
  addListItem('Cost Price: Your purchase cost from supplier (e.g., R32.50)');
  addListItem('Stock Quantity: Current units available (e.g., 150)');
  addListItem('Minimum Stock: Reorder alert threshold (e.g., 20)');
  addListItem('Expiry Date: Product expiration date (e.g., 2025-12-31)');
  addListItem('Batch Number: Manufacturer lot number (e.g., BN2024-0815)');
  addListItem('Requires Prescription: Enable for Schedule 3-6 medicines (e.g., ON for antibiotics)');
  addSpacer(5);
  addSubtitle('Best Practices:', 12);
  addListItem('Set appropriate minimum stock levels');
  addListItem('Regularly check expiry dates');
  addListItem('Keep supplier information up to date');
  addListItem('Perform stock takes periodically');

  // Reports
  doc.addPage();
  y = 20;
  addTitle('9. Reports');
  addSubtitle('Available Reports:', 12);
  addListItem('Sales Reports: Daily, weekly, monthly sales summaries');
  addListItem('Prescription Reports: Track prescriptions dispensed');
  addListItem('Stock Reports: Inventory levels and movements');
  addListItem('Financial Reports: Revenue, expenses, profit analysis (Cashier/Owner only)');
  addListItem('Customer Reports: Patient visit history and spending');
  addSpacer(5);
  addSubtitle('Generating Reports:', 12);
  addListItem('Select the report type you need', '1.');
  addListItem('Choose date range (daily, weekly, monthly, or custom)', '2.');
  addListItem('Apply filters if needed (by product, customer, etc.)', '3.');
  addListItem('Click "Generate Report"', '4.');
  addListItem('View on screen or print', '5.');

  // Admin Module
  doc.addPage();
  y = 20;
  addTitle('10. Admin Module');
  addSubtitle('Patients Tab:', 12);
  addListItem('View all registered patients', '1.');
  addListItem('Add new patient: Click "Add Patient" and enter details', '2.');
  addListItem('Edit patient information: Click edit icon', '3.');
  addListItem('Search patients by name, phone, or email', '4.');
  addListItem('Set credit limits and monitor balances', '5.');
  addSpacer(5);

  addSubtitle('Doctors Tab:', 12);
  addListItem('View all registered doctors', '1.');
  addListItem('Add new doctor: Click "Add Doctor" and enter details including license number', '2.');
  addListItem('Edit doctor information: Click edit icon', '3.');
  addListItem('Search by name, license, or specialization', '4.');
  addSpacer(5);

  addSubtitle('Users Tab (Admin/Owner):', 12);
  addListItem('View all system users', '1.');
  addListItem('Add new user: Click "Add User" and enter email, password, full name, and role', '2.');
  addListItem('Roles: Pharmacist, Admin, Cashier, Owner', '3.');
  addListItem('Update user account: Change username, email, or password', '4.');
  addListItem('Change user roles: Click "Edit Role" on any user', '5.');
  addListItem('Delete users when needed (cannot be undone)', '6.');
  addSpacer(5);

  addSubtitle('Module Permissions Tab (Owner Only):', 12);
  addListItem('View all users and their current module access', '1.');
  addListItem('Click "Edit Permissions" on any user', '2.');
  addListItem('Check/uncheck modules to grant/revoke access', '3.');
  addListItem('Click "Save" to apply changes immediately', '4.');
  addListItem('Users will only see and access permitted modules', '5.');
  addSpacer(5);

  addSubtitle('Important Access Notes:', 12);
  addListItem('Patients/Doctors tabs require permission assignment');
  addListItem('Users tab: Admin and Owner only');
  addListItem('Module Permissions tab: Owner only');
  addListItem('Users cannot access modules without permission');

  // Mobile & Tablet Support
  doc.addPage();
  y = 20;
  addTitle('11. Mobile & Tablet Support');
  addText('PharmaPos works on all devices with responsive design.');
  addSpacer(5);
  
  addSubtitle('Mobile Features:', 12);
  addListItem('Responsive sidebar navigation');
  addListItem('Touch-friendly buttons and controls');
  addListItem('Scrollable tables and tabs');
  addListItem('Card-based layouts on smaller screens');
  addListItem('Optimized for portrait and landscape');
  addSpacer(5);

  addSubtitle('Tips for Mobile Use:', 12);
  addListItem('Use the sidebar toggle to maximize screen space');
  addListItem('Swipe horizontally to scroll tables');
  addListItem('Use search filters to find items quickly');
  addListItem('Tap and hold for additional options');
  addListItem('Rotate device for better table views');

  // Getting Help
  addSpacer(10);
  addTitle('12. Getting Help');
  addText('If you encounter any issues or need further assistance:');
  addSpacer(5);
  addListItem('Contact your system administrator');
  addListItem('Check for system updates regularly');
  addListItem('Keep your browser up to date for best performance');
  addListItem('Clear browser cache if experiencing display issues');

  // Footer on last page
  addSpacer(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('PharmaPos - Pharmacy Management System', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('Powered by: The Wonderland Studio', pageWidth / 2, y, { align: 'center' });

  // Save the PDF
  doc.save('PharmaPos-User-Manual.pdf');
};
