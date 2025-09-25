import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText, Download, Calendar, TrendingUp, Users, Package, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Reports = () => {
  const navigate = useNavigate();

  const handleExportReport = (reportType: string) => {
    toast({ 
      title: `Exporting ${reportType}...`, 
      description: "Report will be downloaded shortly" 
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <Button onClick={() => handleExportReport('All Reports')}>
          <Download className="mr-2 h-4 w-4" />
          Export All Reports
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="dispensing">Dispensing Reports</TabsTrigger>
          <TabsTrigger value="stock">Stock Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R15,234</div>
                <p className="text-xs text-green-600">+12.5% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68</div>
                <p className="text-xs text-green-600">+8.2% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R6,789</div>
                <p className="text-xs text-muted-foreground">44.5% margin</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-green-600">+15 new this month</p>
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
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="text-sm">Daily Sales</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Dispensing Log</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Package className="h-6 w-6 mb-2" />
                    <span className="text-sm">Stock Levels</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
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
                    <Button size="sm">Generate</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Medicine Disposal Report</p>
                      <p className="text-sm text-muted-foreground">Expired & damaged stock</p>
                    </div>
                    <Button size="sm">Generate</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pharmacist Supervision Log</p>
                      <p className="text-sm text-muted-foreground">Daily supervision records</p>
                    </div>
                    <Button size="sm">Generate</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Today's Sales:</span>
                    <span className="font-bold">R15,234.50</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>This Week:</span>
                    <span className="font-bold">R89,456.75</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>This Month:</span>
                    <span className="font-bold">R345,672.20</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Year to Date:</span>
                    <span className="font-bold">R2,456,890.45</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Paracetamol 500mg</p>
                      <p className="text-sm text-muted-foreground">245 units sold</p>
                    </div>
                    <Badge variant="secondary">R3,062.50</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vitamin C 1000mg</p>
                      <p className="text-sm text-muted-foreground">89 units sold</p>
                    </div>
                    <Badge variant="secondary">R8,009.11</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Face Masks (Pack of 50)</p>
                      <p className="text-sm text-muted-foreground">156 units sold</p>
                    </div>
                    <Badge variant="secondary">R2,340.00</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Hand Sanitizer 500ml</p>
                      <p className="text-sm text-muted-foreground">203 units sold</p>
                    </div>
                    <Badge variant="secondary">R4,060.00</Badge>
                  </div>
                </div>
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Prescriptions Today:</span>
                    <span className="font-bold">68</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Chronic Patients:</span>
                    <span className="font-bold">156</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Medical Aid Claims:</span>
                    <span className="font-bold">432</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Average Wait Time:</span>
                    <span className="font-bold">12 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drug Categories Dispensed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Cardiovascular</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-accent rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diabetes</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-accent rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sm">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Respiratory</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-accent rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pain Relief</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-accent rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-sm">30%</span>
                    </div>
                  </div>
                </div>
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Total Products:</span>
                    <span className="font-bold">2,847</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span>Low Stock Items:</span>
                    <span className="font-bold text-red-600">23</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span>Expiring Soon:</span>
                    <span className="font-bold text-yellow-600">45</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span>Stock Value:</span>
                    <span className="font-bold">R458,920</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Movement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Items Received Today:</span>
                    <Badge variant="secondary">127</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Items Dispensed Today:</span>
                    <Badge variant="secondary">234</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stock Adjustments:</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending Orders:</span>
                    <Badge variant="outline">5</Badge>
                  </div>
                </div>
                <Button className="w-full mt-4">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Revenue</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Today:</span>
                      <span className="font-medium">R15,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">This Month:</span>
                      <span className="font-medium">R345,672</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">YTD:</span>
                      <span className="font-medium">R2,456,890</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Costs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cost of Goods:</span>
                      <span className="font-medium">R8,445</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Operating Costs:</span>
                      <span className="font-medium">R2,450</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Costs:</span>
                      <span className="font-medium">R10,895</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Profit</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Gross Profit:</span>
                      <span className="font-medium text-green-600">R6,789</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Net Profit:</span>
                      <span className="font-medium text-green-600">R4,339</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Margin:</span>
                      <span className="font-medium">28.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Profit & Loss Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Tax Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;