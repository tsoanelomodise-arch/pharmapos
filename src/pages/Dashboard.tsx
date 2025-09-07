import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="secondary">Today: {new Date().toLocaleDateString()}</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions Today</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R12,450</div>
            <p className="text-xs text-muted-foreground">+8% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-destructive">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Debtors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R25,890</div>
            <p className="text-xs text-muted-foreground">3 overdue accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
              <div>
                <p className="text-sm font-medium">12 items expire within 30 days</p>
                <p className="text-xs text-muted-foreground">Check stock control for details</p>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
              <div>
                <p className="text-sm font-medium">Medical aid claim pending</p>
                <p className="text-xs text-muted-foreground">Discovery Health - Patient ID: 12345</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
              <div>
                <p className="text-sm font-medium">Stock delivery expected today</p>
                <p className="text-xs text-muted-foreground">Supplier: Pharma Distributors</p>
              </div>
              <Badge variant="secondary">Info</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2">
              <Pill className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm">Prescription dispensed</p>
                <p className="text-xs text-muted-foreground">Patient: Sarah Johnson - 09:45</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm">OTC sale completed</p>
                <p className="text-xs text-muted-foreground">Amount: R125.50 - 09:30</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm">Stock received</p>
                <p className="text-xs text-muted-foreground">50 items from ABC Pharma - 08:15</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm">Payment received</p>
                <p className="text-xs text-muted-foreground">Account: City Clinic - R1,250 - 07:45</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;