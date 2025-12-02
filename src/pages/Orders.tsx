import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, TrendingDown, MessageCircle } from "lucide-react";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";

const Orders = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const { data: suppliers = [] } = useSuppliers();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Expiring within 30 days
  const expiringProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow && product.stock_quantity > 0;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders</h1>
          <Badge variant="secondary">Loading...</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Needs restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringProducts.length}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">Active suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Stock Alerts Section */}
      <Card className="border-[#25D366]/30 bg-[#25D366]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            WhatsApp Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Low Stock Alert */}
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h4 className="font-medium">Low Stock Alert</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {lowStockProducts.length} items need restocking
              </p>
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={() => {
                  const items = lowStockProducts.slice(0, 15).map(p => 
                    `• ${p.name}: ${p.stock_quantity}/${p.minimum_stock} (need ${p.minimum_stock - p.stock_quantity})`
                  ).join('\n');
                  const message = `*📦 LOW STOCK ALERT*\n━━━━━━━━━━━━━━━━━━\nDate: ${new Date().toLocaleDateString()}\n\n*Items Requiring Restock:*\n${items}${lowStockProducts.length > 15 ? `\n\n...and ${lowStockProducts.length - 15} more items` : ''}\n\n━━━━━━━━━━━━━━━━━━\nPlease process this order urgently.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                }}
                disabled={lowStockProducts.length === 0}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Low Stock Alert
              </Button>
            </div>

            {/* Expiring Stock Alert */}
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium">Expiring Stock Alert</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {expiringProducts.length} items expiring within 30 days
              </p>
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={() => {
                  const items = expiringProducts.slice(0, 15).map(p => 
                    `• ${p.name}: ${p.stock_quantity} units (expires ${new Date(p.expiry_date!).toLocaleDateString()})`
                  ).join('\n');
                  const message = `*⚠️ EXPIRING STOCK ALERT*\n━━━━━━━━━━━━━━━━━━\nDate: ${new Date().toLocaleDateString()}\n\n*Items Expiring Soon:*\n${items}${expiringProducts.length > 15 ? `\n\n...and ${expiringProducts.length - 15} more items` : ''}\n\n━━━━━━━━━━━━━━━━━━\nPlease review for returns or promotions.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                }}
                disabled={expiringProducts.length === 0}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Expiring Alert
              </Button>
            </div>
          </div>

          {/* Order to Specific Supplier */}
          {suppliers.length > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-background">
              <h4 className="font-medium mb-3">Quick Order to Supplier</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {suppliers.slice(0, 6).map(supplier => {
                  const supplierProducts = lowStockProducts.filter(p => p.supplier_id === supplier.id);
                  return (
                    <Button
                      key={supplier.id}
                      variant="outline"
                      className="justify-start h-auto py-2 px-3"
                      onClick={() => {
                        const items = supplierProducts.length > 0
                          ? supplierProducts.map(p => `• ${p.name}: need ${p.minimum_stock - p.stock_quantity} units`).join('\n')
                          : 'Please send your latest product catalog and pricing.';
                        const message = `*📋 ORDER REQUEST*\n━━━━━━━━━━━━━━━━━━\nTo: ${supplier.name}\n${supplier.contact_person ? `Attn: ${supplier.contact_person}\n` : ''}Date: ${new Date().toLocaleDateString()}\n\n${supplierProducts.length > 0 ? '*Items Required:*\n' + items : items}\n\n━━━━━━━━━━━━━━━━━━\nPlease confirm availability and delivery timeline.\n\nThank you!`;
                        const phone = supplier.phone?.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '') || '';
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                        <div className="text-left truncate">
                          <p className="font-medium truncate">{supplier.name}</p>
                          {supplierProducts.length > 0 && (
                            <p className="text-xs text-muted-foreground">{supplierProducts.length} low stock items</p>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Purchase Orders</CardTitle>
            <Button variant="outline">Auto-Generate Orders</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Recent Purchase Orders</h4>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                  <div>
                    <p className="font-medium">PO #2024-001</p>
                    <p className="text-sm text-muted-foreground">Pharma Distributors Ltd</p>
                    <p className="text-sm text-muted-foreground">45 items - R25,450.00</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <Badge variant="secondary">Pending</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Created: 2 days ago</p>
                    </div>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                  <div>
                    <p className="font-medium">PO #2024-002</p>
                    <p className="text-sm text-muted-foreground">Medical Supplies Co</p>
                    <p className="text-sm text-muted-foreground">12 items - R8,950.00</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <Badge variant="outline">Delivered</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Delivered: Today</p>
                    </div>
                    <Button size="sm">Receive Stock</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;