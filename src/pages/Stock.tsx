import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingDown, AlertTriangle, Plus, Search, Truck, Trash2, Mail, Phone, MapPin, User, MessageCircle } from "lucide-react";
import { useProducts, useLowStockProducts, useDisposeProductMutation } from "@/hooks/useProducts";
import { useSuppliers, useDeleteSupplierMutation } from "@/hooks/useSuppliers";
import { ProductForm } from "@/components/ProductForm";
import { SupplierForm } from "@/components/SupplierForm";
import { StockReportDialog } from "@/components/StockReportDialog";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCanAccessFinancialData } from "@/hooks/useUserRole";
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

const Stock = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "inventory");
  const [disposalProduct, setDisposalProduct] = useState<{ id: string; name: string; quantity: number } | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string; name: string } | null>(null);
  const { data: products = [], isLoading } = useProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const canAccessFinancialData = useCanAccessFinancialData();
  const disposeProductMutation = useDisposeProductMutation();

  // Sync URL with tab changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    } else if (activeTab !== "inventory") {
      // No tab param means inventory
      setActiveTab("inventory");
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "inventory") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };
  
  const filteredSuppliers = suppliers.filter(supplier => {
    const search = supplierSearchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      supplier.name.toLowerCase().includes(search) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(search)) ||
      (supplier.email && supplier.email.toLowerCase().includes(search)) ||
      (supplier.phone && supplier.phone.includes(search))
    );
  });
  const deleteSupplierMutation = useDeleteSupplierMutation();
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm)) ||
    (product.generic_name && product.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalValue = canAccessFinancialData 
    ? products.reduce((sum, product) => sum + (product.cost_price * product.stock_quantity), 0)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  // Expired products (expiry_date < today)
  const expiredProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate < today && product.stock_quantity > 0;
  });

  // Expiring within 30 days (today <= expiry_date <= 30 days from now)
  const expiringProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow && product.stock_quantity > 0;
  });

  // Expiring within 90 days (30 days < expiry_date <= 90 days)
  const expiringIn90Days = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate > thirtyDaysFromNow && expiryDate <= ninetyDaysFromNow && product.stock_quantity > 0;
  });

  const handleDispose = (product: { id: string; name: string; stock_quantity: number }) => {
    setDisposalProduct({ id: product.id, name: product.name, quantity: product.stock_quantity });
  };

  const confirmDisposal = () => {
    if (disposalProduct) {
      disposeProductMutation.mutate({
        productId: disposalProduct.id,
        quantity: disposalProduct.quantity,
        reason: 'Expired product'
      });
      setDisposalProduct(null);
    }
  };

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Stock Control</h1>
        <div className="flex gap-2">
          <StockReportDialog />
          <ProductForm />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card 
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => handleTabChange("inventory")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold hover:text-primary transition-colors">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-destructive/40 transition-colors"
          onClick={() => handleTabChange("low-stock")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold hover:text-destructive transition-colors">{lowStockProducts.length}</div>
            <p className="text-xs text-destructive">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-yellow-500/40 transition-colors"
          onClick={() => handleTabChange("expiry")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold hover:text-yellow-600 transition-colors">{expiringProducts.length}</div>
            <p className="text-xs text-yellow-600">Within 30 days</p>
          </CardContent>
        </Card>

        {canAccessFinancialData && (
          <Card 
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => handleTabChange("inventory")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold hover:text-primary transition-colors">R{totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">At cost price</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
        <TabsList className="w-full md:w-auto flex overflow-x-auto">
          <TabsTrigger value="inventory" className="flex-1 md:flex-initial text-xs sm:text-sm">Inventory</TabsTrigger>
          <TabsTrigger value="low-stock" className="flex-1 md:flex-initial text-xs sm:text-sm">Low Stock</TabsTrigger>
          <TabsTrigger value="expiry" className="flex-1 md:flex-initial text-xs sm:text-sm">Expiry</TabsTrigger>
          <TabsTrigger value="suppliers" className="flex-1 md:flex-initial text-xs sm:text-sm">Suppliers</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 md:flex-initial text-xs sm:text-sm">Orders</TabsTrigger>
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
              <CardTitle className="text-lg md:text-xl">Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table Headers - Hidden on mobile */}
              <div className={`hidden md:grid ${canAccessFinancialData ? 'md:grid-cols-8' : 'md:grid-cols-7'} gap-4 p-3 border-b font-medium text-sm text-muted-foreground`}>
                <div>Product</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Min Stock</div>
                {canAccessFinancialData && <div>Cost Price</div>}
                <div>Unit Price</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              
              <div className="space-y-3 md:space-y-4 mt-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col md:grid md:grid-cols-7 lg:grid-cols-8 gap-2 md:gap-4 p-3 border rounded-lg">
                    {/* Mobile: Card layout, Desktop: Grid row */}
                    <div className="flex justify-between md:block">
                      <div>
                        <p className="font-medium text-sm md:text-base">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.barcode ? `Barcode: ${product.barcode}` : 'No barcode'}
                        </p>
                      </div>
                      <div className="md:hidden">
                        <ProductForm product={product} />
                      </div>
                    </div>
                    <div className="hidden md:block capitalize">{product.category}</div>
                    <div className="flex justify-between md:block text-sm">
                      <span className="md:hidden text-muted-foreground">Stock:</span>
                      <span className={`font-medium ${product.stock_quantity <= product.minimum_stock ? 'text-red-600' : ''}`}>
                        {product.stock_quantity}
                      </span>
                    </div>
                    <div className="hidden md:block">{product.minimum_stock}</div>
                    {canAccessFinancialData && <div className="hidden lg:block">R{product.cost_price.toFixed(2)}</div>}
                    <div className="flex justify-between md:block text-sm">
                      <span className="md:hidden text-muted-foreground">Price:</span>
                      <span>R{product.unit_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center md:block">
                      <Badge variant={
                        product.stock_quantity === 0 ? "destructive" :
                        product.stock_quantity <= product.minimum_stock ? "destructive" : 
                        "secondary"
                      } className="text-xs">
                        {product.stock_quantity === 0 ? "Out" :
                         product.stock_quantity <= product.minimum_stock ? "Low" : 
                         "In Stock"}
                      </Badge>
                    </div>
                    <div className="hidden md:block">
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-destructive">{lowStockProducts.filter(p => p.stock_quantity === 0).length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">{lowStockProducts.filter(p => p.stock_quantity > 0).length}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">{expiringProducts.length}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-yellow-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Items List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Low Stock Items ({lowStockProducts.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm">Generate Purchase Orders</Button>
                  <Button size="sm" variant="outline">Export List</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {/* Table Headers - Hidden on mobile */}
                  <div className="hidden md:grid md:grid-cols-6 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
                    <div className="col-span-2">Product</div>
                    <div>Current Stock</div>
                    <div>Min Stock</div>
                    <div>Shortage</div>
                    <div>Status</div>
                  </div>
                  
                  {lowStockProducts.map(product => (
                    <div 
                      key={product.id} 
                      className={`flex flex-col md:grid md:grid-cols-6 gap-2 md:gap-4 p-3 border rounded-lg transition-colors ${
                        product.stock_quantity === 0 
                          ? 'bg-destructive/5 border-destructive/30 hover:border-destructive/50' 
                          : 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40'
                      }`}
                    >
                      {/* Product Name */}
                      <div className="col-span-2 flex justify-between md:block">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.generic_name || product.category}
                          </p>
                        </div>
                        <div className="md:hidden">
                          <Badge variant={product.stock_quantity === 0 ? "destructive" : "secondary"} className={product.stock_quantity > 0 ? 'bg-orange-500/20 text-orange-700 border-orange-500/30' : ''}>
                            {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Current Stock */}
                      <div className="flex justify-between md:block text-sm">
                        <span className="md:hidden text-muted-foreground">Current:</span>
                        <span className={`font-bold ${product.stock_quantity === 0 ? 'text-destructive' : 'text-orange-600'}`}>
                          {product.stock_quantity} units
                        </span>
                      </div>
                      
                      {/* Min Stock */}
                      <div className="flex justify-between md:block text-sm">
                        <span className="md:hidden text-muted-foreground">Minimum:</span>
                        <span>{product.minimum_stock} units</span>
                      </div>
                      
                      {/* Shortage */}
                      <div className="flex justify-between md:block text-sm">
                        <span className="md:hidden text-muted-foreground">Shortage:</span>
                        <span className="text-destructive font-medium">
                          -{product.minimum_stock - product.stock_quantity} units
                        </span>
                      </div>
                      
                      {/* Status Badge - Desktop only */}
                      <div className="hidden md:flex items-center">
                        <Badge variant={product.stock_quantity === 0 ? "destructive" : "secondary"} className={product.stock_quantity > 0 ? 'bg-orange-500/20 text-orange-700 border-orange-500/30' : ''}>
                          {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium">No Low Stock Items</p>
                  <p className="text-sm text-muted-foreground">All products are well stocked</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiring Soon Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
                Expiring Soon ({expiringProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringProducts.length > 0 ? (
                <div className="space-y-3">
                  {expiringProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.stock_quantity} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-600">
                          Expires: {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('en-ZA') : 'N/A'}
                        </p>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                          Expiring Soon
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No products expiring within 30 days</p>
                </div>
              )}
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
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expired</p>
                        <p className="text-2xl font-bold text-destructive">{expiredProducts.length}</p>
                        <p className="text-xs">Items require disposal</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-500/5 border-yellow-500/20">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expiring in 30 days</p>
                        <p className="text-2xl font-bold text-yellow-600">{expiringProducts.length}</p>
                        <p className="text-xs">Requires attention</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expiring in 90 days</p>
                        <p className="text-2xl font-bold text-green-600">{expiringIn90Days.length}</p>
                        <p className="text-xs">Monitor closely</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Expired Products - Immediate Action */}
                {expiredProducts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Expired - Immediate Action Required
                    </h4>
                    <div className="space-y-2">
                      {expiredProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.batch_number ? `Batch: ${product.batch_number}` : 'No batch number'} • Stock: {product.stock_quantity} units
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="font-bold text-destructive">
                              Expired: {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('en-ZA') : 'N/A'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDispose(product)}
                              disabled={disposeProductMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Mark for Disposal
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expiring Soon - 30 days */}
                {expiringProducts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-yellow-600" />
                      Expiring Within 30 Days
                    </h4>
                    <div className="space-y-2">
                      {expiringProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.batch_number ? `Batch: ${product.batch_number}` : 'No batch number'} • Stock: {product.stock_quantity} units
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-600">
                              Expires: {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('en-ZA') : 'N/A'}
                            </p>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                              Expiring Soon
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {expiredProducts.length === 0 && expiringProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-lg font-medium">No Expiry Alerts</p>
                    <p className="text-sm text-muted-foreground">All products have valid expiry dates</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Supplier Management ({suppliers.length})</CardTitle>
                <SupplierForm />
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              {suppliers.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers by name, contact, email, or phone..."
                      className="pl-10"
                      value={supplierSearchTerm}
                      onChange={(e) => setSupplierSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {suppliersLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading suppliers...
                </div>
              ) : suppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium">No Suppliers</p>
                  <p className="text-sm text-muted-foreground mb-4">Add your first supplier to get started</p>
                  <SupplierForm />
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium">No Results</p>
                  <p className="text-sm text-muted-foreground">No suppliers match your search</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table Headers - Hidden on mobile */}
                  <div className="hidden md:grid md:grid-cols-6 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
                    <div className="col-span-2">Supplier</div>
                    <div>Phone</div>
                    <div>Email</div>
                    <div>Products</div>
                    <div>Actions</div>
                  </div>
                  
                  {filteredSuppliers.map((supplier) => {
                    const supplierProducts = products.filter(p => p.supplier_id === supplier.id);
                    return (
                      <div 
                        key={supplier.id} 
                        className="flex flex-col md:grid md:grid-cols-6 gap-2 md:gap-4 p-3 border rounded-lg hover:border-primary/30 transition-colors"
                      >
                        {/* Supplier Name & Contact */}
                        <div className="col-span-2 flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{supplier.name}</p>
                            {supplier.contact_person && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">{supplier.contact_person}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Phone */}
                        <div className="flex justify-between md:block text-sm">
                          <span className="md:hidden text-muted-foreground">Phone:</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground md:hidden" />
                            {supplier.phone || <span className="text-muted-foreground">—</span>}
                          </span>
                        </div>
                        
                        {/* Email */}
                        <div className="flex justify-between md:block text-sm min-w-0">
                          <span className="md:hidden text-muted-foreground">Email:</span>
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground md:hidden shrink-0" />
                            {supplier.email || <span className="text-muted-foreground">—</span>}
                          </span>
                        </div>
                        
                        {/* Products Count */}
                        <div className="flex justify-between md:block text-sm">
                          <span className="md:hidden text-muted-foreground">Products:</span>
                          <Badge variant="secondary">{supplierProducts.length}</Badge>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1 justify-end md:justify-start">
                          <SupplierForm supplier={supplier} />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSupplierToDelete({ id: supplier.id, name: supplier.name })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
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

      {/* Disposal Confirmation Dialog */}
      <AlertDialog open={!!disposalProduct} onOpenChange={() => setDisposalProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Product Disposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark <strong>{disposalProduct?.name}</strong> for disposal? 
              This will remove <strong>{disposalProduct?.quantity} units</strong> from stock. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisposal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Disposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Supplier Confirmation Dialog */}
      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{supplierToDelete?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (supplierToDelete) {
                  deleteSupplierMutation.mutate(supplierToDelete.id);
                  setSupplierToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Stock;