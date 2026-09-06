import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, History, Sparkles, Bug, Wrench, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface UpdateEntry {
  version: string;
  date: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'maintenance';
  title: string;
  description: string;
  details?: string[];
}

const updates: UpdateEntry[] = [
  {
    version: "1.7.0",
    date: "2026-09-06",
    type: "feature",
    title: "Remote Stock Replenishment with Supplier Documents",
    description: "Restocking can now be performed remotely with full supplier documentation and an immutable audit trail.",
    details: [
      "New Restock user role can replenish stock and upload supplier documents",
      "Restock dialog captures supplier, invoice number, delivery note number, and invoice/delivery-note files",
      "Each replenishment creates an immutable restock record linked to stock movements",
      "Restock History now shows supplier details, document downloads, and line-item quantities",
      "Twice-weekly low-stock alert email job is scheduled (email delivery requires a configured email provider)"
    ]
  },
  {
    version: "1.6.5",
    date: "2026-09-06",
    type: "improvement",
    title: "PharmaPos Branding",
    description: "The browser tab now uses the PharmaPos logo and full system name.",
    details: [
      "Browser favicon now uses the PharmaPos logo",
      "Browser tab title shows \"PharmaPos — Pharmacy Management System\"",
      "Removed third-party references from browser metadata"
    ]
  },
  {
    version: "1.6.4",
    date: "2026-09-06",
    type: "feature",
    title: "Back-dated POS Transactions",
    description: "Admins and owners can capture a new POS sale with a custom transaction date and time.",
    details: [
      "An optional Transaction Date & Time field appears in the POS checkout panel for admin and owner roles",
      "Leaving it blank uses the current date and time",
      "The database forces the current date and time for all other roles"
    ]
  },
  {
    version: "1.6.3",
    date: "2026-09-06",
    type: "feature",
    title: "Restock Any Inventory Item",
    description: "Admins and owners can now restock any product, not only items flagged as low or out of stock.",
    details: [
      "A 'Show all products' toggle in the Restock dialog reveals the full inventory for admin and owner roles",
      "Other roles continue to see only low and out-of-stock items",
      "Stock badges now show In stock, Low, or Out for each listed product"
    ]
  },
  {
    version: "1.6.2",
    date: "2026-09-06",
    type: "feature",
    title: "Admin Transaction Date Editing",
    description: "Admins and owners can now correct the date and time of a transaction from the Edit Transaction dialog in Transaction History.",
    details: [
      "A Transaction Date & Time field appears in the Edit Transaction dialog for admin and owner roles only",
      "Date changes are enforced at the database level — other roles, including users with the Edit Transactions permission, cannot change a transaction's date",
      "Date changes are recorded in the system-wide Audit Trail"
    ]
  },
  {
    version: "1.6.1",
    date: "2026-09-06",
    type: "bugfix",
    title: "Edit Transactions Permission Fully Enabled",
    description: "Users granted the 'Edit Transactions' module permission can now edit all parts of a transaction, including removing line items.",
    details: [
      "Users with the Edit Transactions permission can now delete sale line items when correcting a transaction",
      "Previously only admins, managers, and owners could remove line items, which could block a permitted user's edit",
      "Verified the edit action in Transaction History and all related data rules respect the permission"
    ]
  },
  {
    version: "1.6.0",
    date: "2026-09-06",
    type: "bugfix",
    title: "User Management List Restored",
    description: "Fixed the user list failing to load in Management, so admins and owners can now see all users again.",
    details: [
      "Repaired a startup error in the list-users service function",
      "All registered users now display with their roles in User Management"
    ]
  },
  {
    version: "1.5.9",
    date: "2026-09-05",
    type: "improvement",
    title: "First-Letter Restock Filtering",
    description: "The Restock dialog now shortlists items based on the first letter typed in the search field.",
    details: [
      "Typing a letter immediately shows products whose name, generic name, or barcode starts with that letter",
      "Search input is automatically focused when the dialog opens",
      "Filtering is memoized for smoother typing on large stock lists"
    ]
  },
  {
    version: "1.5.8",
    date: "2026-09-05",
    type: "improvement",
    title: "Instant Restock Search",
    description: "The Restock dialog now shortlists items from the very first letter typed.",
    details: [
      "Search input is automatically focused when the dialog opens",
      "Filtering is memoized for smoother typing on large stock lists",
      "Results update immediately with each keystroke"
    ]
  },
  {
    version: "1.5.7",
    date: "2026-09-05",
    type: "bugfix",
    title: "Edit Transactions Permission Now Works",
    description: "Staff granted the 'Edit Transactions' permission can now edit completed transactions.",
    details: [
      "Transaction History edit action respects the Edit Transactions permission",
      "Database rules updated to allow permitted staff to save changes"
    ]
  },
  {

    version: "1.5.6",
    date: "2026-09-05",
    type: "bugfix",
    title: "Restock Modal Heading Layout",
    description: "Fixed overlapping between the Restock dialog heading and its search field.",
    details: [
      "Added vertical spacing below the dialog title",
      "Improved line-height and padding for the heading"
    ]
  },
  {
    version: "1.5.5",
    date: "2026-09-05",
    type: "improvement",
    title: "Restock Modal Search",
    description: "The Restock dialog now includes a live search to quickly find low or out-of-stock products.",
    details: [
      "Search matches product name, generic name, and barcode",
      "Results filter instantly as you type",
      "Search term is cleared when the dialog is closed"
    ]
  },
  {
    version: "1.5.4",
    date: "2026-07-02",
    type: "improvement",
    title: "Transaction Number Search",
    description: "The Transaction History search now finds sales by transaction number or customer name.",
    details: [
      "Search accepts transaction numbers with or without the # prefix",
      "Customer names are also matched by the same search box",
      "Search placeholder updated to reflect the new options"
    ]
  },
  {
    version: "1.5.3",
    date: "2026-07-02",
    type: "feature",
    title: "WhatsApp Receipt Sharing",
    description: "Send formatted receipt summaries directly to customers via WhatsApp from the Receipt dialog.",
    details: [
      "New 'WhatsApp' button appears in the Receipt dialog when the customer has a phone number",
      "Receipt is formatted as a concise text message with pharmacy name, items, totals, and payment details",
      "Phone numbers are automatically normalized to international E.164 format",
      "Requires Twilio connection and a configured WhatsApp sender number"
    ]
  },
  {
    version: "1.5.2",
    date: "2026-07-02",
    type: "bugfix",
    title: "Real Dashboard Data & Permission Redirect Fix",
    description: "Dashboard now shows only real sales data, and users with sub-permissions no longer hit an infinite redirect loop.",
    details: [
      "Removed demo fallbacks from Sales by Category, Sales Trend, and Top Selling Products",
      "Category breakdown and top products are now aggregated from real sale_items in the selected date range",
      "Users with only sub-permissions (Settings, Medical Aid, Edit Transactions, Suppliers) now see a clear 'No accessible pages' message instead of looping",
      "Redirects only target modules whose route is guarded by that same module"
    ]
  },
  {
    version: "1.5.1",
    date: "2026-06-26",
    type: "improvement",
    title: "Credit History on Receipts",
    description: "Receipts now show a Credit Notes section listing each refunded item, quantity, amount, timestamp, and reason.",
    details: [
      "New 'Credit Notes' block appears under the receipt totals when credits exist",
      "Each entry shows date/time, line items credited, refund amount, and the captured reason",
      "Updates live after a new per-line credit is processed"
    ]
  },
  {
    version: "1.5.0",
    date: "2026-06-26",
    type: "feature",
    title: "Credit Single Line Items from Receipt",
    description: "Admins and owners can refund an individual product (with partial quantity) directly from the Receipt dialog.",
    details: [
      "New per-line 'Credit' button appears on each item row in the Receipt dialog",
      "Choose quantity (up to remaining un-credited qty) and enter a reason",
      "Stock is restored and a linked credit note is created automatically",
      "Bulk multi-item credits remain available via Transactions → Credit"
    ]
  },
  {
    version: "1.4.9",
    date: "2026-06-15",
    type: "improvement",
    title: "Optional Patient on POS Sales",
    description: "Patient selection on POS sales is now optional. Walk-in sales can be completed without selecting or registering a patient.",
    details: [
      "POS Patient section relabeled to 'Patient (Optional)'",
      "Payment is no longer blocked when no patient is selected",
      "Prescription dispensing still uses the prescription's patient automatically"
    ]
  },
  {
    version: "1.4.8",
    date: "2026-06-14",
    type: "feature",
    title: "Duplicate Patient Detection",
    description: "The system now enforces unique patient phone numbers to prevent duplicate patient records.",
    details: [
      "Database-level unique constraint on patient phone numbers",
      "Both Quick Patient and full Customer forms check for an existing phone before saving",
      "Save is blocked and the existing patient's name is shown in the notification"
    ]
  },
  {
    version: "1.4.7",
    date: "2026-06-13",
    type: "improvement",
    title: "Mandatory Patient Capture in POS",
    description: "POS sales now require selecting an existing patient or registering a new one (name and phone) before payment can be processed.",
    details: [
      "Payment is blocked until a patient is selected for walk-in POS sales",
      "Selected patient must have both a name and a phone number on record",
      "Quick Patient Registration now requires a phone number",
      "Prescription dispensing is unaffected — the prescription's patient is used automatically"
    ]
  },
  {
    version: "1.4.6",
    date: "2026-06-13",
    type: "feature",
    title: "Credit Transactions (Admin/Owner)",
    description: "Admins and owners can credit completed transactions in full or per item from POS and Transaction History.",
    details: [
      "New credit button on each row, restricted to Admin and Owner",
      "Choose specific items and quantities to credit; reason is required",
      "Stock is automatically restored and a reversal recorded in stock movements",
      "A linked credit note is created so all reports (revenue, items sold, payment methods, dashboard) net the refund correctly",
      "Fully credited transactions are marked with a 'Credited' status"
    ]
  },
  {
    version: "1.4.5",
    date: "2026-06-11",
    type: "improvement",
    title: "Inventory Items Sold Revenue Display",
    description: "The Inventory Items Sold chart now displays total sales revenue alongside units sold.",
    details: [
      "Badge shows total revenue (R) for items in the selected period",
      "Tooltip on each bar shows both quantity and sales amount"
    ]
  },
  {
    version: "1.4.4",
    date: "2026-06-11",
    type: "feature",
    title: "Inventory Items Sold Chart on Dashboard",
    description: "New dashboard chart shows units sold per inventory item and updates based on the selected date range.",
    details: [
      "Horizontal bar chart of the top 10 items sold in the selected period",
      "Total units sold badge reflects the active date filter (Today, Last 7/30 Days, Custom)"
    ]
  },
  {
    version: "1.4.3",
    date: "2026-06-09",
    type: "feature",
    title: "Delete Inventory Items (Admin/Owner)",
    description: "Admins and owners can now permanently delete products from the Stock inventory.",
    details: [
      "New delete button on each inventory row, restricted to Admin and Owner roles",
      "Confirmation dialog before deletion to prevent accidents"
    ]
  },
  {
    version: "1.4.2",
    date: "2026-06-06",
    type: "feature",
    title: "Delete Transactions (Admin/Owner)",
    description: "Admins and owners can now permanently delete entries from Transaction History.",
    details: [
      "New delete button on each row in Transactions, restricted to Admin and Owner",
      "Confirmation dialog before deletion",
      "Stock for items in the deleted transaction is automatically restored, with a reversal entry recorded in stock movements"
    ]
  },
  {
    version: "1.4.1",
    date: "2026-06-05",
    type: "feature",
    title: "Per-Subpage Module Permissions",
    description: "Admins and owners can now grant access to individual subpages from Module Permissions.",
    details: [
      "New togglable permissions: Transactions, Suppliers, Audit Trail, System Updates, Database Status",
      "Sidebar sub-items hide automatically when the user lacks the subpage permission",
      "Existing users were backfilled so they keep access to subpages they could previously reach"
    ]
  },
  {
    version: "1.4.0",
    date: "2026-06-05",
    type: "feature",
    title: "System-Wide Audit Trail",
    description: "Added a tamper-resistant, timestamped audit trail under Reports for tracking every change in the system.",
    details: [
      "New page at Reports → Audit Trail (Admin and Owner only)",
      "Automatically logs creates, edits and deletes across sales, prescriptions, stock, patients, doctors, suppliers, users and settings",
      "Captures who, when, what changed, and a JSON diff of before/after values",
      "Filters by date range, entity, action, user, and free-text search",
      "CSV export of filtered results; entries cannot be edited or deleted"
    ]
  },
  {
    version: "1.3.1",
    date: "2026-06-05",
    type: "improvement",
    title: "User Guide Refresh",
    description: "Updated the Help & User Manual to reflect the latest role permissions and access rules.",
    details: [
      "Pharmacist row corrected to show financial data access",
      "Documented Admin/Owner-only transaction edits and POS Recent Transactions visibility",
      "Documented Admin/Owner-only prescription queue deletion"
    ]
  },
  {
    version: "1.3.0",
    date: "2026-06-05",
    type: "improvement",
    title: "Role-Based Access Refinements",
    description: "Tightened access controls across POS, Transactions, and Prescription Queue.",
    details: [
      "Recent Transactions on POS hidden from Pharmacist role (admin/owner only)",
      "Transaction History edits restricted to admin and owner roles",
      "Prescription Queue records can now be deleted by admin and owner roles only"
    ]
  },
  {
    version: "1.2.1",
    date: "2026-06-05",
    type: "bugfix",
    title: "Prescription Dispensing Foreign Key Fix",
    description: "Resolved an error when dispensing prescriptions that referenced missing or unselected products.",
    details: [
      "Only billable medications with valid products are processed",
      "Clear validation error when products are missing from inventory"
    ]
  },
  {
    version: "1.2.0",
    date: "2024-12-02",
    type: "feature",
    title: "Downloadable PDF User Manual",
    description: "Added the ability to download a comprehensive PDF version of the Help & User Manual.",
    details: [
      "Clickable table of contents for easy navigation",
      "System screenshots included for visual reference",
      "Complete step-by-step instructions for all modules"
    ]
  },
  {
    version: "1.1.5",
    date: "2024-11-28",
    type: "improvement",
    title: "Enhanced Stock Report",
    description: "Improved stock report functionality with additional filtering and export options.",
    details: [
      "Added expiring soon products section",
      "Printable stock reports",
      "Summary cards for quick overview"
    ]
  },
  {
    version: "1.1.4",
    date: "2024-11-25",
    type: "bugfix",
    title: "Prescription Queue Sorting Fix",
    description: "Fixed an issue where prescriptions were not sorting correctly by date.",
    details: [
      "Prescriptions now correctly display latest first",
      "Improved filter performance"
    ]
  },
  {
    version: "1.1.3",
    date: "2024-11-20",
    type: "feature",
    title: "Module Permissions System",
    description: "Introduced granular module permissions allowing owners to control user access to specific system modules.",
    details: [
      "Owners can assign/revoke module access per user",
      "Users only see permitted navigation items",
      "Route protection prevents unauthorized access"
    ]
  },
  {
    version: "1.1.2",
    date: "2024-11-15",
    type: "improvement",
    title: "User Profile Management",
    description: "Enhanced user profile settings with ability to update username and password.",
    details: [
      "Self-service password changes",
      "Profile picture support",
      "Current password verification required"
    ]
  },
  {
    version: "1.1.1",
    date: "2024-11-10",
    type: "maintenance",
    title: "Performance Optimizations",
    description: "Various performance improvements across the application.",
    details: [
      "Lazy loading for all pages",
      "Optimized database queries",
      "Reduced bundle size"
    ]
  },
  {
    version: "1.1.0",
    date: "2024-11-05",
    type: "feature",
    title: "Supplier Management",
    description: "Added comprehensive supplier management functionality to Stock Control.",
    details: [
      "Add, edit, and delete suppliers",
      "Track products per supplier",
      "Contact information management"
    ]
  },
  {
    version: "1.0.5",
    date: "2024-10-30",
    type: "bugfix",
    title: "Customer Balance Calculation Fix",
    description: "Fixed issues with customer balance calculations in the Debtors module.",
  },
  {
    version: "1.0.4",
    date: "2024-10-25",
    type: "improvement",
    title: "Mobile Responsive Design",
    description: "Improved mobile experience across all modules with responsive layouts.",
    details: [
      "Touch-friendly controls",
      "Optimized table views for mobile",
      "Collapsible sidebar on small screens"
    ]
  },
  {
    version: "1.0.0",
    date: "2024-10-01",
    type: "feature",
    title: "Initial Release",
    description: "First stable release of PharmaPos - Pharmacy Management System.",
    details: [
      "Dashboard with key metrics",
      "Prescription dispensing workflow",
      "Point of Sale system",
      "Stock management",
      "Customer/Debtors management",
      "Reports and analytics",
      "User role management"
    ]
  }
];

const getTypeBadge = (type: UpdateEntry['type']) => {
  switch (type) {
    case 'feature':
      return <Badge className="bg-green-500 hover:bg-green-600"><Sparkles className="h-3 w-3 mr-1" /> New Feature</Badge>;
    case 'improvement':
      return <Badge className="bg-blue-500 hover:bg-blue-600"><Wrench className="h-3 w-3 mr-1" /> Improvement</Badge>;
    case 'bugfix':
      return <Badge className="bg-orange-500 hover:bg-orange-600"><Bug className="h-3 w-3 mr-1" /> Bug Fix</Badge>;
    case 'maintenance':
      return <Badge variant="secondary"><Wrench className="h-3 w-3 mr-1" /> Maintenance</Badge>;
    default:
      return <Badge variant="outline">Update</Badge>;
  }
};

const filterUpdates = (type: string) => {
  if (type === 'all') return updates;
  return updates.filter(u => u.type === type);
};

export default function SystemUpdates() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-2xl md:text-4xl font-bold">System Updates</h1>
          </div>
          <Button asChild variant="outline" className="gap-2 w-full sm:w-auto">
            <Link to="/help">
              <BookOpen className="h-4 w-4" />
              Back to Help
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm md:text-lg">
          Track all updates, improvements, and changes to PharmaPos
        </p>
      </div>

      {/* Current Version Card */}
      <Card className="mb-6 md:mb-8 border-primary/50 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl">Current Version</CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">v{updates[0].version}</Badge>
          </div>
          <CardDescription>
            Last updated: {new Date(updates[0].date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Updates List */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <History className="h-5 w-5" />
            Update History
          </CardTitle>
          <CardDescription>
            Complete changelog of all system updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="feature">Features</TabsTrigger>
              <TabsTrigger value="improvement">Improvements</TabsTrigger>
              <TabsTrigger value="bugfix">Bug Fixes</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            {['all', 'feature', 'improvement', 'bugfix', 'maintenance'].map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                {filterUpdates(type).map((update, index) => (
                  <div 
                    key={`${update.version}-${index}`}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">v{update.version}</Badge>
                        {getTypeBadge(update.type)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(update.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-base mb-1">{update.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                    {update.details && (
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {update.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {filterUpdates(type).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No updates found in this category.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
