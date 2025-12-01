import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingDown, AlertTriangle, Plus, Search, Truck, Edit2 } from "lucide-react";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { ProductForm } from "@/components/ProductForm";
import { StockReportDialog } from "@/components/StockReportDialog";
import { useState } from "react";
import { useCanAccessFinancialData } from "@/hooks/useUserRole";

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading } = useProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const canAccessFinancialData = useCanAccessFinancialData();
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm)) ||
    (product.generic_name && product.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Stock Control</h1>
          <Badge variant="secondary">Loading...</Badge>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Control</h1>
        <div className="flex gap-2">
          <StockReportDialog />
          <ProductForm />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-destructive">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringProducts.length}</div>
            <p className="text-xs text-yellow-600">Within 30 days</p>
          </CardContent>
        </Card>

        {canAccessFinancialData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">At cost price</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Tracking</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="stock-search">Search Inventory</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stock-search"
                      placeholder="Search by product name, barcode, or category..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" className="mt-6">
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory List */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table Headers */}
              <div className={`grid ${canAccessFinancialData ? 'grid-cols-8' : 'grid-cols-7'} gap-4 p-3 border-b font-medium text-sm text-muted-foreground`}>
                <div>Product</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Min Stock</div>
                {canAccessFinancialData && <div>Cost Price</div>}
                <div>Unit Price</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              
              <div className="space-y-4 mt-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className={`grid ${canAccessFinancialData ? 'grid-cols-8' : 'grid-cols-7'} gap-4 p-3 border rounded-lg items-center`}>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.barcode ? `Barcode: ${product.barcode}` : 'No barcode'}
                      </p>
                    </div>
                    <div className="capitalize">{product.category}</div>
                    <div className={`font-medium ${product.stock_quantity <= product.minimum_stock ? 'text-red-600' : ''}`}>
                      {product.stock_quantity}
                    </div>
                    <div>{product.minimum_stock}</div>
                    {canAccessFinancialData && <div>R{product.cost_price.toFixed(2)}</div>}
                    <div>R{product.unit_price.toFixed(2)}</div>
                    <div>
                      <Badge variant={
                        product.stock_quantity === 0 ? "destructive" :
                        product.stock_quantity <= product.minimum_stock ? "destructive" : 
                        "secondary"
                      }>
                        {product.stock_quantity === 0 ? "Out of Stock" :
                         product.stock_quantity <= product.minimum_stock ? "Low Stock" : 
                         "In Stock"}
                      </Badge>
                    </div>
                    <div>
                      <ProductForm product={product} />
                    </div>
                  </div>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-800">Critical - Low/Out of Stock</h4>
                    <Badge variant="destructive">{lowStockProducts.filter(p => p.stock_quantity === 0).length} out of stock</Badge>
                  </div>
                  <div className="space-y-2">
                    {lowStockProducts.slice(0, 5).map(product => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span>{product.name}</span>
                        <span className="font-medium">{product.stock_quantity} units (Min: {product.minimum_stock})</span>
                      </div>
                    ))}
                    {lowStockProducts.length > 5 && (
                      <p className="text-sm text-muted-foreground">... and {lowStockProducts.length - 5} more items</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-800">Expiring Soon</h4>
                    <Badge variant="outline">{expiringProducts.length} items</Badge>
                  </div>
                  <div className="space-y-2">
                    {expiringProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span>{product.name}</span>
                        <span className="font-medium">
                          Expires: {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                    {expiringProducts.length > 3 && (
                      <p className="text-sm text-muted-foreground">... and {expiringProducts.length - 3} more items</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>Generate Purchase Orders</Button>
                  <Button variant="outline">Export List</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expiry Date Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expired</p>
                        <p className="text-2xl font-bold text-red-600">5</p>
                        <p className="text-xs">Items require disposal</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expiring in 30 days</p>
                        <p className="text-2xl font-bold text-yellow-600">45</p>
                        <p className="text-xs">Requires attention</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expiring in 90 days</p>
                        <p className="text-2xl font-bold text-green-600">128</p>
                        <p className="text-xs">Monitor closely</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Immediate Action Required</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium">Cough Syrup 200ml</p>
                        <p className="text-sm text-muted-foreground">Batch: CS2024001</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">Expired: 15 Jan 2024</p>
                        <Button size="sm" variant="destructive">Mark for Disposal</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium">Antacid Tablets</p>
                        <p className="text-sm text-muted-foreground">Batch: AT2024005</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-600">Expires: 15 Feb 2024</p>
                        <Button size="sm" variant="outline">Discount Sale</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Truck className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">Pharma Distributors Ltd</h4>
                          <p className="text-sm text-muted-foreground">Primary Supplier</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last Order:</span>
                          <span>3 days ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Products:</span>
                          <span>1,247</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Terms:</span>
                          <span>30 days</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3">View Catalog</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Truck className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">Medical Supplies Co</h4>
                          <p className="text-sm text-muted-foreground">Equipment Supplier</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last Order:</span>
                          <span>1 week ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Products:</span>
                          <span>325</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Terms:</span>
                          <span>60 days</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3">View Catalog</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Truck className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">Wellness Products SA</h4>
                          <p className="text-sm text-muted-foreground">Supplements</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last Order:</span>
                          <span>2 weeks ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Products:</span>
                          <span>186</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Terms:</span>
                          <span>45 days</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3">View Catalog</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Purchase Order
                  </Button>
                  <Button variant="outline">Auto-Generate Orders</Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Purchase Orders</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">PO #2024-001</p>
                        <p className="text-sm text-muted-foreground">Pharma Distributors Ltd</p>
                        <p className="text-sm text-muted-foreground">45 items - R25,450.00</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Pending</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Created: 2 days ago</p>
                      </div>
                      <Button size="sm" className="ml-4">View Details</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">PO #2024-002</p>
                        <p className="text-sm text-muted-foreground">Medical Supplies Co</p>
                        <p className="text-sm text-muted-foreground">12 items - R8,950.00</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Delivered</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Delivered: Today</p>
                      </div>
                      <Button size="sm" className="ml-4">Receive Stock</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stock;