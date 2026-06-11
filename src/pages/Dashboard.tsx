import { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pill, ShoppingCart, Package, Users, TrendingUp, AlertTriangle, Plus, CalendarIcon, Calendar, Boxes } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useUserModules } from "@/hooks/useModulePermissions";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

type DatePreset = "today" | "7days" | "30days" | "all" | "custom";

const Dashboard = memo(() => {
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // Calculate date filters based on preset
  const getDateFilter = () => {
    const now = new Date();
    switch (datePreset) {
      case "today":
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
        };
      case "7days":
        return {
          startDate: startOfDay(subDays(now, 7)).toISOString(),
          endDate: endOfDay(now).toISOString(),
        };
      case "30days":
        return {
          startDate: startOfDay(subDays(now, 30)).toISOString(),
          endDate: endOfDay(now).toISOString(),
        };
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            startDate: startOfDay(customStartDate).toISOString(),
            endDate: endOfDay(customEndDate).toISOString(),
          };
        }
        return {};
      default:
        return {};
    }
  };

  const dateFilter = getDateFilter();
  
  const { data: stats, isLoading } = useDashboardStats({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
  });
  const { data: userModules, isLoading: modulesLoading } = useUserModules();
  const navigate = useNavigate();

  const hasAccess = (module: string) => userModules?.includes(module as any) ?? false;

  if (isLoading || modulesLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Check if any metric cards should be shown
  const showMetricCards = hasAccess('dispensing') || hasAccess('pos') || hasAccess('stock') || hasAccess('debtors');
  const showCharts = hasAccess('reports') || hasAccess('pos') || hasAccess('stock');

  // Get label for selected period
  const getPeriodLabel = () => {
    switch (datePreset) {
      case "today": return "Today";
      case "7days": return "Last 7 Days";
      case "30days": return "Last 30 Days";
      case "custom": return customStartDate && customEndDate 
        ? `${format(customStartDate, "MMM d")} - ${format(customEndDate, "MMM d")}`
        : "Custom Range";
      default: return "All Time";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Welcome back! Here's your overview for {getPeriodLabel().toLowerCase()}.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
          {hasAccess('pos') && (
            <Button onClick={() => navigate('/pos')} size="default" className="shadow-lg text-sm sm:text-base">
              <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              New Sale
            </Button>
          )}
        </div>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Date Range Pickers */}
              {datePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[160px] justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        disabled={(date) => customEndDate ? date > customEndDate : false}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[160px] justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "MMM d, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={(date) => customStartDate ? date < customStartDate : false}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {showMetricCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hasAccess('dispensing') && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-3xl font-bold cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => navigate('/dispensing')}
                >
                  {stats?.prescriptionsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Processed in period</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('pos') && (
            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sales</CardTitle>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-3xl font-bold cursor-pointer hover:text-emerald-600 transition-colors" 
                  onClick={() => navigate('/pos')}
                >
                  R{stats?.salesTotal.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total revenue in period</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('stock') && (
            <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-3xl font-bold cursor-pointer hover:text-orange-600 transition-colors" 
                  onClick={() => navigate('/stock')}
                >
                  {stats?.lowStockItems || 0}
                </div>
                <p className="text-xs text-destructive mt-1 font-medium">Requires attention</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('debtors') && (
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Debtors</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-3xl font-bold cursor-pointer hover:text-blue-600 transition-colors" 
                  onClick={() => navigate('/debtors')}
                >
                  R{stats?.totalDebt.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.debtorsCount || 0} overdue accounts</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions & Alerts */}
      {(hasAccess('stock') || hasAccess('reports')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          {hasAccess('stock') && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Low Stock Alerts
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/stock')}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {stats.lowStockProducts.map((product) => (
                      <div 
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg hover:border-orange-500/40 transition-colors cursor-pointer"
                        onClick={() => navigate('/stock')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Min: {product.minimum_stock} units
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={product.stock_quantity === 0 ? "destructive" : "secondary"}
                            className={`whitespace-nowrap ${product.stock_quantity > 0 ? 'bg-orange-500/20 text-orange-700 border-orange-500/30' : ''}`}
                          >
                            {product.stock_quantity === 0 ? 'Out of Stock' : `${product.stock_quantity} left`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No low stock alerts</p>
                    <p className="text-xs text-muted-foreground">All items are well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Other Alerts */}
          {hasAccess('reports') && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {hasAccess('stock') && (
                  <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-xl hover:border-destructive/40 transition-colors">
                    <div>
                      <p className="text-sm font-semibold">{stats?.expiringItems || 0} items expire within 30 days</p>
                      <p className="text-xs text-muted-foreground mt-1">Check stock control for details</p>
                    </div>
                    <Badge 
                      variant="destructive" 
                      className="cursor-pointer hover:bg-destructive/80 px-4 py-1.5 shadow-sm" 
                      onClick={() => navigate('/stock')}
                    >
                      Urgent
                    </Badge>
                  </div>
                )}
                <div 
                  className="flex items-center justify-between p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
                  onClick={() => navigate('/reports')}
                >
                  <div>
                    <p className="text-sm font-semibold">Medical aid claim pending</p>
                    <p className="text-xs text-muted-foreground mt-1">Discovery Health - Patient ID: 12345</p>
                  </div>
                  <Badge variant="accent" className="shadow-sm">Pending</Badge>
                </div>
                {hasAccess('stock') && (
                  <div 
                    className="flex items-center justify-between p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
                    onClick={() => navigate('/stock')}
                  >
                    <div>
                      <p className="text-sm font-semibold">Stock delivery expected today</p>
                      <p className="text-xs text-muted-foreground mt-1">Supplier: Pharma Distributors</p>
                    </div>
                    <Badge variant="success" className="shadow-sm">Info</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-6">
              {hasAccess('dispensing') && (
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20 hover:shadow-sm"
                  onClick={() => navigate('/dispensing')}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Prescription dispensed</p>
                    <p className="text-xs text-muted-foreground truncate">Patient: Sarah Johnson - 09:45</p>
                  </div>
                </div>
              )}
              {hasAccess('pos') && (
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-emerald-500/5 transition-all border border-transparent hover:border-emerald-500/20 hover:shadow-sm"
                  onClick={() => navigate('/pos')}
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">OTC sale completed</p>
                    <p className="text-xs text-muted-foreground truncate">Amount: R125.50 - 09:30</p>
                  </div>
                </div>
              )}
              {hasAccess('stock') && (
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-orange-500/5 transition-all border border-transparent hover:border-orange-500/20 hover:shadow-sm"
                  onClick={() => navigate('/stock')}
                >
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Stock received</p>
                    <p className="text-xs text-muted-foreground truncate">50 items from ABC Pharma - 08:15</p>
                  </div>
                </div>
              )}
              {hasAccess('debtors') && (
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-blue-500/5 transition-all border border-transparent hover:border-blue-500/20 hover:shadow-sm"
                  onClick={() => navigate('/debtors')}
                >
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Payment received</p>
                    <p className="text-xs text-muted-foreground truncate">Account: City Clinic - R1,250 - 07:45</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          {(hasAccess('reports') || hasAccess('pos')) && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Sales Trend (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={stats?.salesTrend || []}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3BB3B0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3BB3B0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `R${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => [`R${value.toFixed(2)}`, 'Sales']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3BB3B0" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown Chart */}
          {hasAccess('reports') && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-accent-foreground" />
                  Sales by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats?.categoryData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.categoryData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Share']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Products Chart */}
          {(hasAccess('reports') || hasAccess('stock')) && (
            <Card className="overflow-hidden lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats?.topProducts || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => [`${value} units`, 'Sold']}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Inventory Items Sold Chart */}
          {(hasAccess('reports') || hasAccess('stock')) && (
            <Card className="overflow-hidden lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    Inventory Items Sold
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {stats?.totalItemsSold || 0} units · R{stats?.totalItemsAmount?.toFixed(2) || '0.00'} · {getPeriodLabel()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {stats?.inventoryItemsSold && stats.inventoryItemsSold.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={stats.inventoryItemsSold}
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        width={140}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number, _name: string, props: any) => {
                          const amount = props?.payload?.amount || 0;
                          return [
                            <div key="qty" className="text-right">{value} units</div>,
                            <div key="amt" className="text-right">R{Number(amount).toFixed(2)}</div>,
                            'Sold'
                          ];
                        }}
                      />
                      <Bar dataKey="quantity" fill="#3BB3B0" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Boxes className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No inventory items sold in this period</p>
                    <p className="text-xs text-muted-foreground">Try selecting a different date range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;