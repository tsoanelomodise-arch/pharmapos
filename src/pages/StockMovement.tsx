import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Package, ArrowDown, ArrowUp, RefreshCw, Loader2 } from "lucide-react";
import { useStockMovements } from "@/hooks/useStockMovements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

type DatePreset = "today" | "7days" | "30days" | "this-month" | "all" | "custom";

const getDateRange = (preset: DatePreset): { start?: Date; end?: Date } => {
  const today = new Date();
  switch (preset) {
    case "today":
      return { start: today, end: today };
    case "7days":
      return { start: subDays(today, 7), end: today };
    case "30days":
      return { start: subDays(today, 30), end: today };
    case "this-month":
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case "all":
      return { start: undefined, end: undefined };
    case "custom":
      return { start: undefined, end: undefined };
  }
};

export default function StockMovement() {
  const [datePreset, setDatePreset] = useState<DatePreset>("7days");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const getActiveDates = () => {
    if (datePreset === "custom") {
      return { start: customStartDate, end: customEndDate };
    }
    return getDateRange(datePreset);
  };

  const { start, end } = getActiveDates();
  const { data, isLoading } = useStockMovements({ startDate: start, endDate: end });

  const handlePresetChange = (value: DatePreset) => {
    setDatePreset(value);
    if (value !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge variant="destructive" className="flex items-center gap-1"><ArrowDown className="h-3 w-3" />Sale</Badge>;
      case "return":
        return <Badge variant="secondary" className="flex items-center gap-1"><ArrowUp className="h-3 w-3" />Return</Badge>;
      case "adjustment":
        return <Badge variant="outline" className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Prepare chart data - aggregate movements by date
  const chartData = useMemo(() => {
    if (!data?.movements) return [];
    
    const dailyData: Record<string, { date: string; sales: number; returns: number; adjustments: number }> = {};
    
    data.movements.forEach((movement) => {
      const date = format(new Date(movement.created_at), "MMM dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, sales: 0, returns: 0, adjustments: 0 };
      }
      const qty = Math.abs(movement.quantity);
      if (movement.movement_type === "sale") {
        dailyData[date].sales += qty;
      } else if (movement.movement_type === "return") {
        dailyData[date].returns += qty;
      } else if (movement.movement_type === "adjustment") {
        dailyData[date].adjustments += qty;
      }
    });
    
    return Object.values(dailyData).reverse();
  }, [data?.movements]);

  const chartConfig = {
    sales: { label: "Sales", color: "hsl(var(--destructive))" },
    returns: { label: "Returns", color: "hsl(142 76% 36%)" },
    adjustments: { label: "Adjustments", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Movement</h1>
        <p className="text-muted-foreground">Track inventory changes over time</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={datePreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {datePreset === "custom" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalMovements || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <ArrowDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.sales || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Returned</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.returns || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.adjustments || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" name="Returns" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adjustments" name="Adjustments" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Movement Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.movements || data.movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No stock movements found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{format(new Date(movement.created_at), "PPP p")}</TableCell>
                      <TableCell className="font-medium">{movement.product_name}</TableCell>
                      <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          movement.movement_type === "sale" && "text-destructive",
                          movement.movement_type === "return" && "text-green-600"
                        )}>
                          {movement.movement_type === "sale" ? "-" : movement.movement_type === "return" ? "+" : ""}
                          {Math.abs(movement.quantity)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{movement.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
