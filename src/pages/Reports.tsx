import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, FileText, Download, TrendingUp, Users, Package, DollarSign, Receipt, Search, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAllSales } from "@/hooks/useSales";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { format } from "date-fns";
import { 
  useReportsSummary, 
  useTopSellingProducts, 
  useSalesByCategory, 
  useStockMovementStats,
  useDispensingStats 
} from "@/hooks/useReportsData";

const Reports = () => {
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const { data: allSales = [] } = useAllSales({
    paymentMethod: paymentMethodFilter,
  });

  const { data: summary, isLoading: summaryLoading } = useReportsSummary();
  const { data: topProducts = [], isLoading: topProductsLoading } = useTopSellingProducts(5);
  const { data: salesByCategory = [], isLoading: categoryLoading } = useSalesByCategory();
  const { data: stockMovement, isLoading: stockMovementLoading } = useStockMovementStats();
  const { data: dispensingStats, isLoading: dispensingLoading } = useDispensingStats();

  const handleExportReport = (reportType: string) => {
    toast({ 
      title: `Exporting ${reportType}...`, 
      description: "Report will be downloaded shortly" 
    });
  };

  const handleViewTransaction = (saleId: string) => {
    setSelectedSaleId(saleId);
    setShowReceipt(true);
  };

  const filteredSales = allSales.filter(sale => {
    const matchesSearch = searchTerm === '' || 
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercentage = (value: number, showSign = true) => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
        <Button onClick={() => handleExportReport('All Reports')} size="sm" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
        <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="dashboard" className="flex-1 md:flex-initial text-xs sm:text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 md:flex-initial text-xs sm:text-sm">Transactions</TabsTrigger>
          <TabsTrigger value="sales" className="flex-1 md:flex-initial text-xs sm:text-sm">Sales</TabsTrigger>
          <TabsTrigger value="dispensing" className="flex-1 md:flex-initial text-xs sm:text-sm">Dispensing</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 md:flex-initial text-xs sm:text-sm">Stock</TabsTrigger>
          <TabsTrigger value="financial" className="flex-1 md:flex-initial text-xs sm:text-sm">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(summary?.dailyRevenue || 0)}</div>
                    <p className={`text-xs ${(summary?.dailyRevenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(summary?.dailyRevenueChange || 0)} from yesterday
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{summary?.prescriptionsToday || 0}</div>
                    <p className={`text-xs ${(summary?.prescriptionsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(summary?.prescriptionsChange || 0)} from yesterday
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(summary?.dailyGrossProfit || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(summary?.dailyProfitMargin || 0, false)} margin
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{summary?.activePatients?.toLocaleString() || 0}</div>
                    <p className="text-xs text-green-600">
                      +{summary?.newPatientsThisMonth || 0} new this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleExportReport('Daily Sales')}>
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="text-sm">Daily Sales</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleExportReport('Dispensing Log')}>
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Dispensing Log</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleExportReport('Stock Levels')}>
                    <Package className="h-6 w-6 mb-2" />
                    <span className="text-sm">Stock Levels</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleExportReport('Patient Stats')}>
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Patient Stats</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regulatory Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Controlled Substances Register</p>
                      <p className="text-sm text-muted-foreground">Schedule 5 & 6 medicines</p>
                    </div>
                    <Button size="sm" onClick={() => handleExportReport('Controlled Substances')}>Generate</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Medicine Disposal Report</p>
                      <p className="text-sm text-muted-foreground">Expired & damaged stock</p>
                    </div>
                    <Button size="sm" onClick={() => handleExportReport('Medicine Disposal')}>Generate</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pharmacist Supervision Log</p>
                      <p className="text-sm text-muted-foreground">Daily supervision records</p>
                    </div>
                    <Button size="sm" onClick={() => handleExportReport('Supervision Log')}>Generate</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle>All Transactions</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="insurance">Medical Aid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleExportReport('Transactions')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cash Paid</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.map((sale) => (
                        <TableRow 
                          key={sale.id} 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleViewTransaction(sale.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            #{sale.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(sale.created_at), 'hh:mm a')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {sale.payment_method === 'insurance' ? 'Medical Aid' : sale.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(sale.total_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sale.payment_status === 'completed' ? 'secondary' : 'destructive'}>
                              {sale.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sale.cash_paid ? formatCurrency(sale.cash_paid) : '-'}
                          </TableCell>
                          <TableCell>
                            {sale.change_given ? formatCurrency(sale.change_given) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransaction(sale.id);
                              }}
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Today's Sales:</span>
                      <span className="font-bold">{formatCurrency(summary?.dailyRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>This Week:</span>
                      <span className="font-bold">{formatCurrency(summary?.weeklyRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>This Month:</span>
                      <span className="font-bold">{formatCurrency(summary?.monthlyRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Year to Date:</span>
                      <span className="font-bold">{formatCurrency(summary?.yearlyRevenue || 0)}</span>
                    </div>
                  </div>
                )}
                <Button className="w-full mt-4" onClick={() => handleExportReport('Sales Report')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Sales Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topProductsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : topProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sales data available</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.unitsSold} units sold</p>
                        </div>
                        <Badge variant="secondary">{formatCurrency(product.revenue)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dispensing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispensing Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {dispensingLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Prescriptions Today:</span>
                      <span className="font-bold">{dispensingStats?.prescriptionsToday || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Chronic Patients:</span>
                      <span className="font-bold">{dispensingStats?.chronicPatients || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Medical Aid Claims:</span>
                      <span className="font-bold">{dispensingStats?.medicalAidClaims || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : salesByCategory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No category data available</p>
                ) : (
                  <div className="space-y-3">
                    {salesByCategory.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span>{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-accent rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right">{cat.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Total Products:</span>
                      <span className="font-bold">{summary?.totalProducts?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span>Low Stock Items:</span>
                      <span className="font-bold text-red-600">{summary?.lowStockItems || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span>Expiring Soon:</span>
                      <span className="font-bold text-yellow-600">{summary?.expiringSoonItems || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span>Stock Value:</span>
                      <span className="font-bold">{formatCurrency(summary?.stockValue || 0)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Movement</CardTitle>
              </CardHeader>
              <CardContent>
                {stockMovementLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Items Received Today:</span>
                      <Badge variant="secondary">{stockMovement?.received || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Items Dispensed Today:</span>
                      <Badge variant="secondary">{stockMovement?.dispensed || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stock Adjustments:</span>
                      <Badge variant="secondary">{stockMovement?.adjustments || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Out of Stock:</span>
                      <Badge variant="outline">{summary?.outOfStockItems || 0}</Badge>
                    </div>
                  </div>
                )}
                <Button className="w-full mt-4" onClick={() => handleExportReport('Stock Report')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Stock Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Today:</span>
                        <span className="font-medium">{formatCurrency(summary?.dailyRevenue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">This Month:</span>
                        <span className="font-medium">{formatCurrency(summary?.monthlyRevenue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">YTD:</span>
                        <span className="font-medium">{formatCurrency(summary?.yearlyRevenue || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Costs (Today)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Cost of Goods:</span>
                        <span className="font-medium">{formatCurrency(summary?.costOfGoods || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Stock Value:</span>
                        <span className="font-medium">{formatCurrency(summary?.stockValue || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Profit (Today)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Gross Profit:</span>
                        <span className="font-medium text-green-600">{formatCurrency(summary?.dailyGrossProfit || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Margin:</span>
                        <span className="font-medium">{formatPercentage(summary?.dailyProfitMargin || 0, false)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handleExportReport('Profit & Loss')}>
                  <Download className="mr-2 h-4 w-4" />
                  Profit & Loss Report
                </Button>
                <Button variant="outline" onClick={() => handleExportReport('Tax Report')}>
                  <Download className="mr-2 h-4 w-4" />
                  Tax Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog */}
      {selectedSaleId && (
        <ReceiptDialog
          saleId={selectedSaleId}
          open={showReceipt}
          onOpenChange={setShowReceipt}
        />
      )}
    </div>
  );
};

export default Reports;
