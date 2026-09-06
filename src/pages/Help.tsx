import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ShieldCheck, LayoutDashboard, Pill, ShoppingCart, CreditCard, Package, FileText, Settings, Lock, Smartphone, Monitor, Download, History, Database } from "lucide-react";
import { generateHelpPdf } from "@/utils/generateHelpPdf";
import { Link } from "react-router-dom";
import { useUserModules } from "@/hooks/useModulePermissions";

export default function Help() {
  const { data: userModules = [] } = useUserModules();
  const handleDownloadPdf = () => {
    generateHelpPdf();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-2xl md:text-4xl font-bold">Help & User Manual</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {userModules.includes('system_updates') && (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/help/updates">
                  <History className="h-4 w-4" />
                  System Updates
                </Link>
              </Button>
            )}
            {userModules.includes('database_status') && (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/help/database">
                  <Database className="h-4 w-4" />
                  Database Status
                </Link>
              </Button>
            )}
            <Button onClick={handleDownloadPdf} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF Manual
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm md:text-lg">
          Complete guide to using PharmaPos - Pharmacy Management System
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-6 md:mb-8">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Monitor className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Get started with PharmaPos in minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-2">1</div>
              <p className="text-sm font-medium">Login</p>
              <p className="text-xs text-muted-foreground">Use your credentials provided by the administrator</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-2">2</div>
              <p className="text-sm font-medium">Dashboard</p>
              <p className="text-xs text-muted-foreground">Review today's metrics and alerts</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <p className="text-sm font-medium">Navigate</p>
              <p className="text-xs text-muted-foreground">Use the sidebar to access modules</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-2">4</div>
              <p className="text-sm font-medium">Work</p>
              <p className="text-xs text-muted-foreground">Dispense, sell, or manage as needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Roles Section */}
      <Card className="mb-6 md:mb-8">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <ShieldCheck className="h-5 w-5" />
            User Roles & Permissions
          </CardTitle>
          <CardDescription>
            Understanding access levels in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border rounded-lg p-4">
              <Badge className="mb-2">Pharmacist</Badge>
              <p className="text-sm text-muted-foreground mb-2">Day-to-day dispensing and sales operations</p>
              <ul className="text-sm space-y-1">
                <li>✓ Access to assigned modules only</li>
                <li>✓ Dispense prescriptions</li>
                <li>✓ Process sales (POS)</li>
                <li>✓ View stock, cost pricing & supplier data</li>
                <li>✗ View Recent Transactions / Transaction History edits</li>
                <li>✗ Delete prescriptions from queue</li>
                <li>✗ Management & user administration</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge variant="secondary" className="mb-2">Admin</Badge>
              <p className="text-sm text-muted-foreground mb-2">Extended access for administrative tasks</p>
              <ul className="text-sm space-y-1">
                <li>✓ All module access (if assigned)</li>
                <li>✓ Manage patients & doctors</li>
                <li>✓ Create & manage user accounts</li>
                <li>✓ Assign user roles</li>
                <li>✓ View & edit completed transactions</li>
                <li>✓ Delete prescriptions from queue</li>
                <li>✗ Set module permissions</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge variant="secondary" className="mb-2">Cashier</Badge>
              <p className="text-sm text-muted-foreground mb-2">Financial data access for cashier operations</p>
              <ul className="text-sm space-y-1">
                <li>✓ Access to assigned modules</li>
                <li>✓ View cost pricing</li>
                <li>✓ View supplier data</li>
                <li>✓ Financial reports access</li>
                <li>✗ User management</li>
                <li>✗ Set module permissions</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge variant="secondary" className="mb-2">Restock</Badge>
              <p className="text-sm text-muted-foreground mb-2">Remote stock replenishment and supplier document capture</p>
              <ul className="text-sm space-y-1">
                <li>✓ Access to assigned modules</li>
                <li>✓ Replenish stock from low-stock alerts</li>
                <li>✓ Capture supplier, invoice and delivery-note details</li>
                <li>✓ Upload invoice and delivery-note files</li>
                <li>✓ View restock history and download documents</li>
                <li>✗ User management</li>
                <li>✗ Set module permissions</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <Badge className="mb-2 bg-amber-500">Owner</Badge>
              <p className="text-sm text-muted-foreground mb-2">Complete system control including permissions</p>
              <ul className="text-sm space-y-1">
                <li>✓ Full system access</li>
                <li>✓ Create & manage all users</li>
                <li>✓ Set module permissions</li>
                <li>✓ View all financial data</li>
                <li>✓ Edit completed transactions & delete prescriptions</li>
                <li>✓ Delete user accounts</li>
                <li>✓ Full system configuration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Permissions */}
      <Card className="mb-6 md:mb-8">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Lock className="h-5 w-5" />
            Module Permissions System
          </CardTitle>
          <CardDescription>
            How access to different system modules is controlled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How It Works:</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Each user is assigned specific modules they can access. This is controlled by the Owner through the Module Permissions section in Admin. Users will only see navigation items and can only access pages for modules they have been granted permission to.
            </p>
            <h4 className="font-semibold mb-2">Available Modules:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <Badge variant="outline" className="justify-center">Dashboard</Badge>
              <Badge variant="outline" className="justify-center">Dispensing</Badge>
              <Badge variant="outline" className="justify-center">POS & Sales</Badge>
              <Badge variant="outline" className="justify-center">Debtors</Badge>
              <Badge variant="outline" className="justify-center">Stock Control</Badge>
              <Badge variant="outline" className="justify-center">Reports</Badge>
              <Badge variant="outline" className="justify-center">Admin</Badge>
              <Badge variant="outline" className="justify-center">Patients</Badge>
              <Badge variant="outline" className="justify-center">Doctors</Badge>
              <Badge variant="outline" className="justify-center">Help</Badge>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
            <p className="text-sm font-semibold">⚠️ Important:</p>
            <ul className="text-sm space-y-1 mt-2">
              <li>• Only Owners can modify module permissions</li>
              <li>• Users cannot access modules they don't have permission for</li>
              <li>• Direct URL access to restricted modules will redirect users</li>
              <li>• Owners automatically have access to all modules</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card className="mb-6 md:mb-8">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
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
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Dashboard Overview</span>
                  <Badge variant="outline" className="ml-2 hidden sm:inline-flex">All Users</Badge>
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dispensing */}
            <AccordionItem value="dispensing">
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Dispensing Prescriptions</span>
                  <Badge variant="outline" className="ml-2 hidden sm:inline-flex">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">How to dispense a prescription:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Create New Prescription:</strong> Click "New Prescription" button</li>
                    <li><strong>Select Patient:</strong> Search by typing patient name, phone, or email</li>
                    <li><strong>Enter Doctor Information:</strong> Search by doctor name, license number, or specialization</li>
                    <li><strong>Add Medications:</strong> Search and add prescribed medications with:
                      <ul className="ml-6 mt-1 space-y-1">
                        <li>- Dosage form (tablets, capsules, syrup, etc.)</li>
                        <li>- Frequency (once daily, twice daily, etc.)</li>
                        <li>- Duration (3 days, 7 days, 30 days, etc.)</li>
                        <li>- Quantity to dispense</li>
                      </ul>
                    </li>
                    <li><strong>Save Prescription:</strong> Click "Save" to create the prescription</li>
                    <li><strong>Dispense:</strong> Click "Dispense" to process and proceed to payment</li>
                    <li><strong>Print Labels:</strong> Print medicine labels for each medication</li>
                  </ol>
                  <h4 className="font-semibold mt-4">Prescription Queue:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Prescriptions are sorted by date (latest first)</li>
                    <li>• Filter by status: Pending, Dispensed, or All</li>
                    <li>• Search by patient name or doctor</li>
                    <li>• Stock quantities are automatically decremented when dispensed</li>
                    <li>• Only Admin and Owner roles can delete prescription records from the queue</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* POS */}
            <AccordionItem value="pos">
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Point of Sale (POS)</span>
                  <Badge variant="outline" className="ml-2 hidden sm:inline-flex">All Users</Badge>
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
                    <li>• When dispensing prescriptions, medications auto-populate the cart</li>
                    <li>• Product details, prices, and quantities are pre-filled</li>
                    <li>• Review and adjust quantities before completing the sale</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Transactions & Receipts:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• The "Recent Transactions" panel on POS is visible to Admin and Owner only</li>
                    <li>• Transaction History is accessible via "View All" — Admin/Owner can edit completed transactions to correct errors</li>
                    <li>• Other roles can still reprint their own receipts via the "Last Receipt" button</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Debtors */}
            <AccordionItem value="debtors">
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Debtors Management</span>
                  <Badge variant="outline" className="ml-2 hidden sm:inline-flex">All Users</Badge>
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
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Stock Management</span>
                  <Badge variant="outline" className="ml-2 hidden sm:inline-flex">All Users</Badge>
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
                    <li><strong>Stock Report:</strong> Generate comprehensive inventory reports</li>
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
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Reports</span>
                  <Badge variant="outline" className="ml-2 hidden sm:inline-flex">All Users</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Available reports:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Sales Reports:</strong> Daily, weekly, monthly sales summaries</li>
                    <li><strong>Prescription Reports:</strong> Track prescriptions dispensed</li>
                    <li><strong>Stock Reports:</strong> Inventory levels and movements</li>
                    <li><strong>Financial Reports:</strong> Revenue, expenses, profit analysis (Cashier/Owner only)</li>
                    <li><strong>Customer Reports:</strong> Patient visit history and spending</li>
                  </ul>
                  <h4 className="font-semibold mt-4">Generating reports:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Select the report type you need</li>
                    <li>Choose date range (daily, weekly, monthly, or custom)</li>
                    <li>Apply filters if needed (by product, customer, etc.)</li>
                    <li>Click "Generate Report"</li>
                    <li>View on screen or print</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Management */}
            <AccordionItem value="management">
              <AccordionTrigger className="text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Admin Module</span>
                  <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">Admin/Owner</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Patients Tab:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all registered patients</li>
                    <li>Add new patient: Click "Add Patient" and enter details</li>
                    <li>Edit patient information: Click edit icon</li>
                    <li>Search patients by name, phone, or email</li>
                    <li>Set credit limits and monitor balances</li>
                  </ol>

                  <h4 className="font-semibold mt-4">Doctors Tab:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all registered doctors</li>
                    <li>Add new doctor: Click "Add Doctor" and enter details including license number</li>
                    <li>Edit doctor information: Click edit icon</li>
                    <li>Search by name, license, or specialization</li>
                  </ol>

                  <h4 className="font-semibold mt-4">Users Tab (Admin/Owner):</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all system users</li>
                    <li>Add new user: Click "Add User" and enter email, password, full name, and role</li>
                    <li>Roles: Pharmacist, Admin, Cashier, Restock, Owner</li>
                    <li>Update user account: Change username, email, or password</li>
                    <li>Change user roles: Click "Edit Role" on any user</li>
                    <li>Delete users when needed (cannot be undone)</li>
                  </ol>

                  <h4 className="font-semibold mt-4">Module Permissions Tab (Owner Only):</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>View all users and their current module access</li>
                    <li>Click "Edit Permissions" on any user</li>
                    <li>Check/uncheck modules to grant/revoke access</li>
                    <li>Click "Save" to apply changes immediately</li>
                    <li>Users will only see and access permitted modules</li>
                  </ol>

                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg mt-4">
                    <p className="text-sm font-semibold">⚠️ Important Access Notes:</p>
                    <ul className="text-sm space-y-1 mt-2">
                      <li>• Patients/Doctors tabs require permission assignment</li>
                      <li>• Users tab: Admin and Owner only</li>
                      <li>• Module Permissions tab: Owner only</li>
                      <li>• Users cannot access modules without permission</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Mobile & Responsive */}
      <Card className="mb-6 md:mb-8">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Smartphone className="h-5 w-5" />
            Mobile & Tablet Support
          </CardTitle>
          <CardDescription>
            PharmaPos works on all devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Mobile Features:</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Responsive sidebar navigation</li>
                <li>✓ Touch-friendly buttons and controls</li>
                <li>✓ Scrollable tables and tabs</li>
                <li>✓ Card-based layouts on smaller screens</li>
                <li>✓ Optimized for portrait and landscape</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Tips for Mobile Use:</h4>
              <ul className="text-sm space-y-1">
                <li>• Use the sidebar toggle to maximize screen space</li>
                <li>• Swipe horizontally to scroll tables</li>
                <li>• Use search filters to find items quickly</li>
                <li>• Tap and hold for additional options</li>
                <li>• Rotate device for better table views</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Help */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Need Additional Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>If you encounter any issues or need further assistance:</p>
          <ul className="space-y-1 ml-4">
            <li>• Contact your system administrator</li>
            <li>• Check for system updates regularly</li>
            <li>• Keep your browser up to date for best performance</li>
            <li>• Clear browser cache if experiencing display issues</li>
          </ul>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              PharmaPos - Pharmacy Management System<br />
              Powered by: The Wonderland Studio
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
