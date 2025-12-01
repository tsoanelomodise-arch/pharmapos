import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useCanAccessFinancialData } from "@/hooks/useUserRole";
import { format } from "date-fns";

export const StockReportDialog = () => {
  const { data: products = [] } = useProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const canAccessFinancialData = useCanAccessFinancialData();

  const totalValue = canAccessFinancialData
    ? products.reduce((sum, product) => sum + (product.cost_price * product.stock_quantity), 0)
    : 0;

  const expiringProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  });

  const expiredProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    return new Date(product.expiry_date) < new Date();
  });

  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Stock Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:mb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>Stock Report</span>
            <Button onClick={handlePrint} variant="outline" size="sm" className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4" id="stock-report">
          {/* Report Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">Stock Control Report</h1>
            <p className="text-muted-foreground">Generated on {format(new Date(), "dd MMMM yyyy 'at' HH:mm")}</p>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{expiringProducts.length}</p>
            </div>
          </div>

          {canAccessFinancialData && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Stock Value (at cost)</p>
              <p className="text-3xl font-bold">R{totalValue.toFixed(2)}</p>
            </div>
          )}

          {/* Low Stock Items */}
          {lowStockProducts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg border-b pb-2">Low Stock Items ({lowStockProducts.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Current Stock</th>
                      <th className="text-right p-2">Min Stock</th>
                      <th className="text-right p-2">Shortage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product.id} className="border-b">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2 capitalize">{product.category}</td>
                        <td className="p-2 text-right font-medium text-destructive">{product.stock_quantity}</td>
                        <td className="p-2 text-right">{product.minimum_stock}</td>
                        <td className="p-2 text-right font-medium">{product.minimum_stock - product.stock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expired Items */}
          {expiredProducts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg border-b pb-2 text-destructive">Expired Items ({expiredProducts.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Batch</th>
                      <th className="text-right p-2">Stock</th>
                      <th className="text-right p-2">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredProducts.map(product => (
                      <tr key={product.id} className="border-b bg-red-50">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.batch_number || 'N/A'}</td>
                        <td className="p-2 text-right">{product.stock_quantity}</td>
                        <td className="p-2 text-right text-destructive font-medium">
                          {product.expiry_date ? format(new Date(product.expiry_date), "dd MMM yyyy") : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expiring Soon Items */}
          {expiringProducts.filter(p => !expiredProducts.includes(p)).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg border-b pb-2 text-orange-600">Expiring Within 30 Days ({expiringProducts.filter(p => !expiredProducts.includes(p)).length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Batch</th>
                      <th className="text-right p-2">Stock</th>
                      <th className="text-right p-2">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringProducts.filter(p => !expiredProducts.includes(p)).map(product => (
                      <tr key={product.id} className="border-b bg-orange-50">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.batch_number || 'N/A'}</td>
                        <td className="p-2 text-right">{product.stock_quantity}</td>
                        <td className="p-2 text-right text-orange-600 font-medium">
                          {product.expiry_date ? format(new Date(product.expiry_date), "dd MMM yyyy") : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Full Inventory */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg border-b pb-2">Full Inventory ({products.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Stock</th>
                    <th className="text-right p-2">Unit Price</th>
                    {canAccessFinancialData && <th className="text-right p-2">Cost</th>}
                    {canAccessFinancialData && <th className="text-right p-2">Value</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2 capitalize">{product.category}</td>
                      <td className={`p-2 text-right ${product.stock_quantity <= product.minimum_stock ? 'text-destructive font-medium' : ''}`}>
                        {product.stock_quantity}
                      </td>
                      <td className="p-2 text-right">R{product.unit_price.toFixed(2)}</td>
                      {canAccessFinancialData && <td className="p-2 text-right">R{product.cost_price.toFixed(2)}</td>}
                      {canAccessFinancialData && <td className="p-2 text-right">R{(product.cost_price * product.stock_quantity).toFixed(2)}</td>}
                    </tr>
                  ))}
                </tbody>
                {canAccessFinancialData && (
                  <tfoot>
                    <tr className="bg-muted font-bold">
                      <td colSpan={5} className="p-2 text-right">Total Value:</td>
                      <td className="p-2 text-right">R{totalValue.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>PharmaPos - Stock Control Report</p>
            <p>Report generated automatically - {format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
