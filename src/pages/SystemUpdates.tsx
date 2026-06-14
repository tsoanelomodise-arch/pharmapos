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
