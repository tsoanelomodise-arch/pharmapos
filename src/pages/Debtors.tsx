import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, AlertCircle, DollarSign, Calendar, Search, Plus, Eye, Edit2, Mail } from "lucide-react";
import { useCustomersWithDebt } from "@/hooks/useCustomers";
import { CustomerForm } from "@/components/CustomerForm";
import { CustomerAccountDialog } from "@/components/CustomerAccountDialog";
import { CustomerStatementDialog } from "@/components/CustomerStatementDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Debtors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: debtorCustomers = [], isLoading } = useCustomersWithDebt();
  const { toast } = useToast();
  
  const totalDebt = debtorCustomers.reduce((sum, customer) => sum + customer.current_balance, 0);
  const overdueAccounts = debtorCustomers.filter(customer => customer.current_balance > 1000).length;
  
  const handleGenerateStatements = async () => {
    setIsGenerating(true);
    
    // Simulate statement generation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
    setShowGenerateDialog(false);
    
    toast({
      title: "Statements Generated",
      description: `Successfully generated ${debtorCustomers.length} customer statements. Ready to print or email.`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Debtors Management</h1>
          <Badge variant="secondary">Loading...</Badge>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Debtors Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateDialog(true)}
            disabled={debtorCustomers.length === 0}
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <FileText className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Generate </span>Statements
          </Button>
          <CustomerForm />
        </div>
      </div>

      {/* Generate Statements Dialog */}
      <AlertDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Customer Statements</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate statements for all {debtorCustomers.length} customers with outstanding balances.
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Customers:</span>
                  <span className="font-medium">{debtorCustomers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Outstanding:</span>
                  <span className="font-medium">R{totalDebt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">High Balance Accounts:</span>
                  <span className="font-medium">{overdueAccounts}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleGenerateStatements}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Statements"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalDebt.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total outstanding debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueAccounts}</div>
            <p className="text-xs text-destructive">High balance accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debtorCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Customers with debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R78,940</div>
            <p className="text-xs text-muted-foreground">95% collection rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4 md:space-y-6">
        <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="accounts" className="flex-1 md:flex-initial text-xs sm:text-sm">Accounts</TabsTrigger>
          <TabsTrigger value="aging" className="flex-1 md:flex-initial text-xs sm:text-sm">Aging</TabsTrigger>
          <TabsTrigger value="statements" className="flex-1 md:flex-initial text-xs sm:text-sm">Statements</TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 md:flex-initial text-xs sm:text-sm">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="account-search">Search Accounts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="account-search"
                      placeholder="Search by account name, number, or contact person..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline" className="mt-6">
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Debtor Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debtorCustomers.map((customer) => (
                  <div key={customer.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Users className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{customer.name}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{customer.phone || 'No phone'}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{customer.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                      <div className="text-right">
                        <p className="font-bold text-base md:text-lg">R{customer.current_balance.toFixed(2)}</p>
                        <Badge variant={customer.current_balance > 1000 ? "destructive" : "secondary"} className="text-xs">
                          {customer.current_balance > 1000 ? "High" : "Current"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Limit: R{customer.credit_limit.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-row md:flex-col gap-1">
                      <CustomerAccountDialog customer={customer} />
                      <CustomerStatementDialog customer={customer} />
                      <CustomerForm customer={customer} />
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">ABC Corporate Wellness</h3>
                      <p className="text-sm text-muted-foreground">Account: ACC002</p>
                      <p className="text-sm text-muted-foreground">Contact: John Johnson</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">R8,750.00</p>
                    <Badge variant="secondary">Current</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Last payment: 5 days ago</p>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    <Button size="sm">View Account</Button>
                    <Button size="sm" variant="outline">Send Statement</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Sunshine Retirement Home</h3>
                      <p className="text-sm text-muted-foreground">Account: ACC003</p>
                      <p className="text-sm text-muted-foreground">Contact: Maria Garcia</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">R22,180.00</p>
                    <Badge variant="outline">30 days</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Last payment: 22 days ago</p>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    <Button size="sm">View Account</Button>
                    <Button size="sm" variant="outline">Send Statement</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aging Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Current (0-30 days)</p>
                      <p className="text-2xl font-bold text-green-600">R45,230</p>
                      <p className="text-xs">62 accounts</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">31-60 days</p>
                      <p className="text-2xl font-bold text-yellow-600">R32,150</p>
                      <p className="text-xs">28 accounts</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">61-90 days</p>
                      <p className="text-2xl font-bold text-orange-600">R28,460</p>
                      <p className="text-xs">18 accounts</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">90+ days</p>
                      <p className="text-2xl font-bold text-red-600">R20,000</p>
                      <p className="text-xs">19 accounts</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Overdue Priority Accounts</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium">City Medical Centre</p>
                      <p className="text-sm text-muted-foreground">95 days overdue</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">R15,450</p>
                      <Button size="sm" variant="destructive">Urgent Follow-up</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="font-medium">Metro Clinic Group</p>
                      <p className="text-sm text-muted-foreground">78 days overdue</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">R12,800</p>
                      <Button size="sm" variant="outline">Send Reminder</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statement Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20">
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <span>Generate All Statements</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-20">
                    <div className="text-center">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                      <span>Overdue Only</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-20">
                    <div className="text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <span>Monthly Statements</span>
                    </div>
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Recent Statement Activity</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Statements sent today:</span>
                      <Badge variant="secondary">25</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Email delivery rate:</span>
                      <Badge variant="secondary">98%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Automatic reminders sent:</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="h-16">
                    <div className="text-center">
                      <DollarSign className="h-6 w-6 mx-auto mb-2" />
                      <span>Record Payment</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <span>Payment History</span>
                    </div>
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <h4 className="font-medium">Recent Payments</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">ABC Corporate Wellness</p>
                          <p className="text-sm text-muted-foreground">EFT Payment - Ref: 12345</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R5,450.00</p>
                          <p className="text-xs text-muted-foreground">Today, 2:30 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Sunshine Retirement Home</p>
                          <p className="text-sm text-muted-foreground">Cheque Payment</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R12,800.00</p>
                          <p className="text-xs text-muted-foreground">Yesterday, 10:15 AM</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Debtors;