import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Receipt, Search, Calendar, ArrowLeft, ChevronLeft, ChevronRight, DollarSign, CreditCard, TrendingUp, Pencil, CalendarIcon, Trash2, RotateCcw } from "lucide-react";
import { useAllSalesWithDetails, SaleWithDetails, useDeleteSaleMutation } from "@/hooks/useSales";
import { useUserModules } from '@/hooks/useModulePermissions';
import { useUserRole } from "@/hooks/useUserRole";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { CreditTransactionDialog } from "@/components/CreditTransactionDialog";
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
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type DatePreset = "today" | "7days" | "30days" | "all" | "custom";

const Transactions = () => {
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setVisibleCount(20);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<SaleWithDetails | null>(null);
  const [deletingSale, setDeletingSale] = useState<SaleWithDetails | null>(null);
  const [creditingSaleId, setCreditingSaleId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const { data: role } = useUserRole();
  const { data: modules } = useUserModules();
  const canEditTransactions =
    role === 'admin' || role === 'owner' || (modules?.includes('edit_transactions') ?? false);
  const canDeleteTransactions = role === 'admin' || role === 'owner';
  const canCreditTransactions = role === 'admin' || role === 'owner';
  const deleteSale = useDeleteSaleMutation();

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
  
  const { data: allSales = [], isLoading } = useAllSalesWithDetails({
    paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
  });

  // Client-side filter (memoized) so typing doesn't refetch from the server
  const sales = useMemo(() => {
    const term = debouncedSearch.replace(/^#/, "").trim().toLowerCase();
    if (!term) return allSales;
    return allSales.filter((s) => {
      const idStr = (s.id || "").toLowerCase();
      const shortId = idStr.slice(-8);
      const name = (s.customer?.name || "").toLowerCase();
      const phone = (s.customer?.phone || "").toLowerCase();
      return (
        idStr.includes(term) ||
        shortId.includes(term) ||
        name.includes(term) ||
        phone.includes(term)
      );
    });
  }, [allSales, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary stats
  const totalAmount = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const avgTransaction = sales.length > 0 ? totalAmount / sales.length : 0;

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      cash: "default",
      card: "secondary",
      credit: "outline",
      insurance: "secondary",
    };
    return <Badge variant={variants[method] || "default"}>{method.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'credited') {
      return <Badge variant="destructive">Credited</Badge>;
    }
    return (
      <Badge variant={status === "completed" ? "default" : "outline"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/pos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to POS
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sales.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R{totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg. Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R{avgTransaction.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={datePreset} onValueChange={(v) => { setDatePreset(v as DatePreset); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]">
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
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction # or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
            
            {/* Custom Date Range Pickers */}
            {datePreset === "custom" && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Date Range:</span>
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
                        onSelect={(date) => { setCustomStartDate(date); setCurrentPage(1); }}
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
                        onSelect={(date) => { setCustomEndDate(date); setCurrentPage(1); }}
                        disabled={(date) => customStartDate ? date < customStartDate : false}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : paginatedSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(sale.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{sale.id.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {sale.customer?.name || <span className="text-muted-foreground">Walk-in</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{sale.items_count || 0}</Badge>
                        </TableCell>
                        <TableCell>{getPaymentMethodBadge(sale.payment_method)}</TableCell>
                        <TableCell className="text-right font-medium">
                          R{sale.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEditTransactions && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSale(sale)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedSaleId(sale.id)}
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            {canCreditTransactions
                              && !sale.credit_note_for
                              && sale.payment_status !== 'credited'
                              && sale.total_amount >= 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Credit transaction"
                                onClick={() => setCreditingSaleId(sale.id)}
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteTransactions && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingSale(sale)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      {selectedSaleId && (
        <ReceiptDialog
          saleId={selectedSaleId}
          open={!!selectedSaleId}
          onOpenChange={(open) => !open && setSelectedSaleId(null)}
        />
      )}

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        sale={editingSale}
        open={!!editingSale}
        onOpenChange={(open) => !open && setEditingSale(null)}
      />

      {/* Credit Transaction Dialog */}
      <CreditTransactionDialog
        saleId={creditingSaleId}
        open={!!creditingSaleId}
        onOpenChange={(open) => !open && setCreditingSaleId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSale} onOpenChange={(open) => !open && setDeletingSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingSale && (
                <>
                  Transaction <span className="font-mono">#{deletingSale.id.slice(-8).toUpperCase()}</span>{" "}
                  for R{deletingSale.total_amount.toFixed(2)} will be permanently deleted.
                  Stock for sold items will be restored. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSale.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSale.isPending}
              onClick={async () => {
                if (!deletingSale) return;
                await deleteSale.mutateAsync(deletingSale.id);
                setDeletingSale(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSale.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transactions;
