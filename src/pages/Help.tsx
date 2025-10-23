import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, ShieldCheck, LayoutDashboard, Pill, ShoppingCart, CreditCard, Package, FileText, Settings } from "lucide-react";

export default function Help() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Help & User Manual</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Complete guide to using the Pharmacy Management System
        </p>
      </div>

      {/* User Roles Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            User Roles & Permissions
          </CardTitle>
          <CardDescription>
            Understanding access levels in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4">
              <Badge className="mb-2">Pharmacist</Badge>
              <p className="text-sm text-muted-foreground mb-2">Basic access level for day-to-day operations</p>
              <ul className="text-sm space-y-1">
                <li>✓ View Dashboard</li>
                <li>✓ Dispense Prescriptions</li>
                <li>✓ Process Sales (POS)</li>
                <li>✓ View Debtors</li>
                <li>✓ View Stock</li>
                <li>✓ Generate Reports</li>
                <li>✗ Management Access</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge variant="secondary" className="mb-2">Admin</Badge>
              <p className="text-sm text-muted-foreground mb-2">Extended access for administrative tasks</p>
              <ul className="text-sm space-y-1">
                <li>✓ All Pharmacist Access</li>
                <li>✓ Manage Patients</li>
                <li>✓ Manage Doctors</li>
                <li>✓ Manage Users</li>
                <li>✗ View Cost Pricing</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge variant="secondary" className="mb-2">Manager</Badge>
              <p className="text-sm text-muted-foreground mb-2">Full operational access including financial data</p>
              <ul className="text-sm space-y-1">
                <li>✓ All Admin Access</li>
                <li>✓ View Cost Pricing</li>
                <li>✓ View Supplier Data</li>
                <li>✓ Financial Reports</li>
                <li>✗ Manage Users</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge className="mb-2">Owner</Badge>
              <p className="text-sm text-muted-foreground mb-2">Complete system access including user management</p>
              <ul className="text-sm space-y-1">
                <li>✓ All Manager Access</li>
                <li>✓ Manage Users</li>
                <li>✓ Assign Roles</li>
                <li>✓ Full System Control</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Step-by-Step Guide
          </CardTitle>
          <CardDescription>
            Detailed instructions for each module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Dashboard */}
            <AccordionItem value="dashboard">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard Overview</span>
                  <Badge variant="outline" className="ml-2">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">What you'll see:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Total Sales:</strong> Today's revenue and sales count</li>
                    <li><strong>Prescriptions:</strong> Number of prescriptions dispensed today</li>
                    <li><strong>Low Stock Alerts:</strong> Products that need reordering</li>
                    <li><strong>Patient Visits:</strong> Number of unique patients served</li>
                    <li><strong>Recent Activity:</strong> Latest transactions and prescriptions</li>
                  </ul>
                  <h4 className="font-semibold mt-4">How to use:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Check the dashboard upon login to review daily metrics</li>
                    <li>Monitor low stock alerts and reorder products as needed</li>
                    <li>Review recent sales and prescription activity</li>
                    <li>Click on any metric card for detailed information</li>
                    <li>Click the logo to return to dashboard from any page</li>
                  </ol>
                  <h4 className="font-semibold mt-4">Performance:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Dashboard loads faster with optimized data fetching</li>
                    <li>• Data is cached for 2 minutes to improve speed</li>
                    <li>• All metrics load simultaneously for better performance</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dispensing */}
            <AccordionItem value="dispensing">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  <span>Dispensing Prescriptions</span>
                  <Badge variant="outline" className="ml-2">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">How to dispense a prescription:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Create New Prescription:</strong> Click "New Prescription" button</li>
                    <li><strong>Select Patient:</strong> Search by typing patient name, phone, or email - the search works instantly as you type</li>
                    <li><strong>Enter Doctor Information:</strong> Search by typing doctor name, license number, or specialization</li>
                    <li><strong>Add Medications:</strong> Search and add prescribed medications with dosage instructions</li>
                    <li><strong>Review Details:</strong> Verify all information is correct</li>
                    <li><strong>Save Prescription:</strong> Click "Save" to create the prescription</li>
                    <li><strong>Dispense:</strong> Click "Dispense" to process the medication and proceed to payment</li>
                  </ol>
                  <h4 className="font-semibold mt-4">Search Tips:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Patient search: Type any part of name, phone number, or email</li>
                    <li>• Doctor search: Type name, license number, or specialization</li>
                    <li>• Search filters results instantly - no need to press Enter</li>
                    <li>• Clear search field to see all available options</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Managing existing prescriptions:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• View pending prescriptions in the list</li>
                    <li>• Search by patient name, doctor, or prescription date</li>
                    <li>• Click on a prescription to view full details</li>
                    <li>• Dispense pending prescriptions when ready</li>
                    <li>• When dispensing, medications automatically populate the POS cart with quantities</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Recent Improvements:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Improved search: Type instantly filters results for patients and doctors</li>
                    <li>• Better modal scrolling: All save buttons are now visible even on smaller screens</li>
                    <li>• Quantity tracking: Medications now include quantities when added to prescriptions</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* POS */}
            <AccordionItem value="pos">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Point of Sale (POS)</span>
                  <Badge variant="outline" className="ml-2">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">How to process a sale:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Search Products:</strong> Use the search bar to find items</li>
                    <li><strong>Scan Barcode:</strong> Or scan product barcodes directly</li>
                    <li><strong>Add to Cart:</strong> Click on products to add them to the cart</li>
                    <li><strong>Adjust Quantity:</strong> Modify quantities as needed</li>
                    <li><strong>Select Customer (Optional):</strong> Link sale to a customer account</li>
                    <li><strong>Choose Payment Method:</strong> Select Cash, Card, or Credit</li>
                    <li><strong>Process Payment:</strong> Click "Complete Sale"</li>
                    <li><strong>Print Receipt:</strong> Receipt is generated automatically</li>
                  </ol>
                  <h4 className="font-semibold mt-4">Payment methods:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong>Cash:</strong> Enter amount paid, change calculated automatically</li>
                    <li>• <strong>Card:</strong> Process card payment</li>
                    <li>• <strong>Credit:</strong> Add to customer's account (requires customer selection)</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Prescription Integration:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• When dispensing prescriptions, medications automatically populate the cart</li>
                    <li>• Product details, prices, and quantities are pre-filled from the prescription</li>
                    <li>• Review and adjust quantities if needed before completing the sale</li>
                    <li>• System validates stock availability and shows clear error messages</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Debtors */}
            <AccordionItem value="debtors">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Debtors Management</span>
                  <Badge variant="outline" className="ml-2">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Managing customer accounts:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>View Debtors:</strong> See list of customers with outstanding balances</li>
                    <li><strong>Search Customers:</strong> Find specific customer accounts</li>
                    <li><strong>View Account Details:</strong> Click on customer to see transaction history</li>
                    <li><strong>Process Payments:</strong> Record payments received from customers</li>
                    <li><strong>View Statements:</strong> Generate and print customer statements</li>
                  </ol>
                  <h4 className="font-semibold mt-4">Important notes:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Credit limits are set per customer</li>
                    <li>• System prevents sales exceeding credit limits</li>
                    <li>• Regular statements should be sent to customers</li>
                    <li>• Monitor aging of accounts receivable</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Stock */}
            <AccordionItem value="stock">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span>Stock Management</span>
                  <Badge variant="outline" className="ml-2">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Managing inventory:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>View Stock:</strong> See all products in inventory</li>
                    <li><strong>Add Product:</strong> Click "Add Product" and fill in details:
                      <ul className="ml-6 mt-1 space-y-1">
                        <li>- Product name and generic name</li>
                        <li>- Barcode (optional)</li>
                        <li>- Category (Prescription/OTC)</li>
                        <li>- Unit price and cost price</li>
                        <li>- Current stock and minimum stock level</li>
                        <li>- Expiry date and batch number</li>
                        <li>- Supplier information</li>
                      </ul>
                    </li>
                    <li><strong>Update Stock:</strong> Edit existing products to update quantities</li>
                    <li><strong>Monitor Alerts:</strong> Check low stock and expiry warnings</li>
                    <li><strong>Search/Filter:</strong> Find products by name, barcode, or category</li>
                  </ol>
                  <h4 className="font-semibold mt-4">Best practices:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Set appropriate minimum stock levels</li>
                    <li>• Regularly check expiry dates</li>
                    <li>• Keep supplier information up to date</li>
                    <li>• Perform stock takes periodically</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Reports */}
            <AccordionItem value="reports">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Reports</span>
                  <Badge variant="outline" className="ml-2">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Available reports:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Sales Reports:</strong> Daily, weekly, monthly sales summaries</li>
                    <li><strong>Prescription Reports:</strong> Track prescriptions dispensed</li>
                    <li><strong>Stock Reports:</strong> Inventory levels and movements</li>
                    <li><strong>Financial Reports:</strong> Revenue, expenses, profit analysis (Manager/Owner only)</li>
                    <li><strong>Customer Reports:</strong> Patient visit history and spending</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Generating reports:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Select the report type you need</li>
                    <li>Choose date range (daily, weekly, monthly, or custom)</li>
                    <li>Apply filters if needed (by product, customer, etc.)</li>
                    <li>Click "Generate Report"</li>
                    <li>View on screen or export to PDF/Excel</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Management */}
            <AccordionItem value="management">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <span>Management Module</span>
                  <Badge variant="secondary" className="ml-2">Admin/Manager/Owner</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Patients Tab (Admin+):</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all registered patients</li>
                    <li>Add new patient: Click "Add Patient" and enter details</li>
                    <li>Edit patient information: Click edit icon</li>
                    <li>Search patients by name, phone, or email</li>
                    <li>Set credit limits and monitor balances</li>
                  </ol>

                  <h4 className="font-semibold mt-4">Doctors Tab (Admin+):</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all registered doctors</li>
                    <li>Add new doctor: Click "Add Doctor" and enter details including license number</li>
                    <li>Edit doctor information: Click edit icon</li>
                    <li>Delete doctor records if needed</li>
                    <li>Search by name, license, or specialization</li>
                  </ol>

                  <h4 className="font-semibold mt-4">Users Tab (Admin/Owner):</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all system users</li>
                    <li>Add new user: Click "Add User" and enter email, password, full name, and role</li>
                    <li>Roles are assigned during user creation (Pharmacist, Admin, Manager, Owner)</li>
                    <li>Change user roles after creation: Click "Edit Role" on any user</li>
                    <li>Delete users when needed (cannot be undone)</li>
                    <li>Search users by email, name, or role</li>
                  </ol>

                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg mt-4">
                    <p className="text-sm font-semibold">⚠️ Important Access Notes:</p>
                    <ul className="text-sm space-y-1 mt-2">
                      <li>• Patients and Doctors tabs: Admin, Manager, and Owner</li>
                      <li>• Users tab: Admin and Owner only</li>
                      <li>• Both Admins and Owners can create and manage user accounts</li>
                      <li>• User roles are assigned during account creation</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Getting Help */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Additional Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>If you encounter any issues or need further assistance:</p>
          <ul className="space-y-1 ml-4">
            <li>• Contact your system administrator</li>
            <li>• Check for system updates regularly</li>
            <li>• Keep your browser up to date for best performance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
