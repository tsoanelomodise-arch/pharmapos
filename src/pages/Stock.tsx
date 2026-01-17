import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingDown, AlertTriangle, Search, Truck, Trash2, Mail, Phone, User, Star, Users } from "lucide-react";
import { useProducts, useLowStockProducts, useDisposeProductMutation } from "@/hooks/useProducts";
import { useSuppliers, useDeleteSupplierMutation } from "@/hooks/useSuppliers";
import { useSupplierProductCounts, useAllProductSuppliers } from "@/hooks/useProductSuppliers";
import { ProductForm } from "@/components/ProductForm";
import { SupplierForm } from "@/components/SupplierForm";
import { StockReportDialog } from "@/components/StockReportDialog";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCanAccessFinancialData } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "inventory");
  const [disposalProduct, setDisposalProduct] = useState<{ id: string; name: string; quantity: number } | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string; name: string } | null>(null);
  const { data: products = [], isLoading } = useProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: supplierProductCounts = {} } = useSupplierProductCounts();
  const { data: allProductSuppliers = [] } = useAllProductSuppliers();
  const canAccessFinancialData = useCanAccessFinancialData();
  const disposeProductMutation = useDisposeProductMutation();
  const deleteSupplierMutation = useDeleteSupplierMutation();

  // Create a map of product ID to their suppliers
  const productSuppliersMap = useMemo(() => {
    const map: Record<string, { supplierId: string; supplierName: string; isPrimary: boolean }[]> = {};
    allProductSuppliers.forEach((ps) => {
      if (!map[ps.product_id]) {
        map[ps.product_id] = [];
      }
      if (ps.supplier) {
        map[ps.product_id].push({
          supplierId: ps.supplier_id,
          supplierName: ps.supplier.name,
          isPrimary: ps.is_primary,
        });
      }
    });
    return map;
  }, [allProductSuppliers]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab !== "inventory") {
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

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm)) ||
        (product.generic_name && product.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (supplierFilter === "all") return matchesSearch;
      if (supplierFilter === "unassigned") {
        return matchesSearch && (!productSuppliersMap[product.id] || productSuppliersMap[product.id].length === 0);
      }
      return matchesSearch && productSuppliersMap[product.id]?.some(s => s.supplierId === supplierFilter);
    });
  }, [products, searchTerm, supplierFilter, productSuppliersMap]);

  const totalValue = canAccessFinancialData
    ? products.reduce((sum, product) => sum + (product.cost_price * product.stock_quantity), 0)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiredProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate < today && product.stock_quantity > 0;
  });

  const expiringProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow && product.stock_quantity > 0;
  });

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
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleTabChange("inventory")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => handleTabChange("low-stock")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-destructive">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-yellow-500/40 transition-colors" onClick={() => handleTabChange("expiry")}>
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
          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleTabChange("inventory")}>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
        <TabsList className="w-full md:w-auto flex overflow-x-auto">
          <TabsTrigger value="inventory" className="flex-1 md:flex-initial text-xs sm:text-sm">Inventory</TabsTrigger>
          <TabsTrigger value="low-stock" className="flex-1 md:flex-initial text-xs sm:text-sm">Low Stock</TabsTrigger>
          <TabsTrigger value="expiry" className="flex-1 md:flex-initial text-xs sm:text-sm">Expiry</TabsTrigger>
          <TabsTrigger value="suppliers" className="flex-1 md:flex-initial text-xs sm:text-sm">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="stock-search">Search Inventory</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stock-search"
                      placeholder="Search by product name, barcode, or generic name..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-[200px]">
                  <Label>Filter by Supplier</Label>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Inventory Items ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className={`hidden md:grid ${canAccessFinancialData ? 'md:grid-cols-9' : 'md:grid-cols-8'} gap-4 p-3 border-b font-medium text-sm text-muted-foreground`}>
                  <div>Product</div>
                  <div>Category</div>
                  <div>Suppliers</div>
                  <div>Stock</div>
                  <div>Min Stock</div>
                  {canAccessFinancialData && <div>Cost Price</div>}
                  <div>Unit Price</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                <div className="space-y-3 md:space-y-4 mt-4">
                  {filteredProducts.map((product) => {
                    const productSuppliersList = productSuppliersMap[product.id] || [];
                    const primarySupplier = productSuppliersList.find(s => s.isPrimary);
                    const otherSuppliers = productSuppliersList.filter(s => !s.isPrimary);

                    return (
                      <div key={product.id} className={`flex flex-col md:grid ${canAccessFinancialData ? 'md:grid-cols-9' : 'md:grid-cols-8'} gap-2 md:gap-4 p-3 border rounded-lg`}>
                        <div className="flex justify-between md:block">
                          <div>
                            <p className="font-medium text-sm md:text-base">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.barcode || 'No barcode'}</p>
                          </div>
                          <div className="md:hidden"><ProductForm product={product} /></div>
                        </div>
                        <div className="hidden md:block capitalize">{product.category}</div>
                        <div className="flex justify-between md:block text-sm">
                          <span className="md:hidden text-muted-foreground">Suppliers:</span>
                          {productSuppliersList.length === 0 ? (
                            <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                          ) : productSuppliersList.length === 1 ? (
                            <span className="flex items-center gap-1">
                              {primarySupplier && <Star className="h-3 w-3 fill-primary text-primary" />}
                              <span className="truncate max-w-[100px]">{productSuppliersList[0].supplierName}</span>
                            </span>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="cursor-help">
                                  <Users className="h-3 w-3 mr-1" />{productSuppliersList.length} suppliers
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">
                                <div className="space-y-1">
                                  {primarySupplier && <p className="flex items-center gap-1 font-medium"><Star className="h-3 w-3 fill-current" />{primarySupplier.supplierName} (Primary)</p>}
                                  {otherSuppliers.map((s) => <p key={s.supplierId}>{s.supplierName}</p>)}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex justify-between md:block text-sm">
                          <span className="md:hidden text-muted-foreground">Stock:</span>
                          <span className={`font-medium ${product.stock_quantity <= product.minimum_stock ? 'text-red-600' : ''}`}>{product.stock_quantity}</span>
                        </div>
                        <div className="hidden md:block">{product.minimum_stock}</div>
                        {canAccessFinancialData && <div className="hidden lg:block">R{product.cost_price.toFixed(2)}</div>}
                        <div className="flex justify-between md:block text-sm">
                          <span className="md:hidden text-muted-foreground">Price:</span>
                          <span>R{product.unit_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center md:block">
                          <Badge variant={product.stock_quantity === 0 ? "destructive" : product.stock_quantity <= product.minimum_stock ? "destructive" : "secondary"} className="text-xs">
                            {product.stock_quantity === 0 ? "Out" : product.stock_quantity <= product.minimum_stock ? "Low" : "In Stock"}
                          </Badge>
                        </div>
                        <div className="hidden md:block"><ProductForm product={product} /></div>
                      </div>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No products found</p>
                      {supplierFilter !== "all" && <Button variant="link" className="mt-2" onClick={() => setSupplierFilter("all")}>Clear filter</Button>}
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Items ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className={`p-3 border rounded-lg ${product.stock_quantity === 0 ? 'bg-destructive/5 border-destructive/30' : 'bg-orange-500/5 border-orange-500/20'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity} / Min: {product.minimum_stock}</p>
                        </div>
                        <Badge variant={product.stock_quantity === 0 ? "destructive" : "outline"}>
                          {product.stock_quantity === 0 ? "Out of Stock" : "Low Stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All products are well stocked!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive">{expiredProducts.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Expiring in 30 days</p>
                <p className="text-2xl font-bold text-orange-600">{expiringProducts.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Expiring in 90 days</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringIn90Days.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Expiring Products</CardTitle></CardHeader>
            <CardContent>
              {[...expiredProducts, ...expiringProducts, ...expiringIn90Days].length > 0 ? (
                <div className="space-y-3">
                  {[...expiredProducts, ...expiringProducts, ...expiringIn90Days].map(product => (
                    <div key={product.id} className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Expires: {product.expiry_date}</p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleDispose(product)}>Dispose</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products expiring soon</p>
                </div>
              )}
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
              {suppliers.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search suppliers..." className="pl-10" value={supplierSearchTerm} onChange={(e) => setSupplierSearchTerm(e.target.value)} />
                  </div>
                </div>
              )}

              {suppliersLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium">No Suppliers</p>
                  <p className="text-sm text-muted-foreground mb-4">Add your first supplier</p>
                  <SupplierForm />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden md:grid md:grid-cols-6 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
                    <div className="col-span-2">Supplier</div>
                    <div>Phone</div>
                    <div>Email</div>
                    <div>Products</div>
                    <div>Actions</div>
                  </div>

                  {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="flex flex-col md:grid md:grid-cols-6 gap-2 md:gap-4 p-3 border rounded-lg hover:border-primary/30 transition-colors">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.contact_person && <p className="text-sm text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{supplier.contact_person}</p>}
                        </div>
                      </div>
                      <div className="flex justify-between md:block text-sm">
                        <span className="md:hidden text-muted-foreground">Phone:</span>
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted-foreground md:hidden" />{supplier.phone || "—"}</span>
                      </div>
                      <div className="flex justify-between md:block text-sm">
                        <span className="md:hidden text-muted-foreground">Email:</span>
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted-foreground md:hidden" />{supplier.email || "—"}</span>
                      </div>
                      <div className="flex justify-between md:block text-sm">
                        <span className="md:hidden text-muted-foreground">Products:</span>
                        <Badge variant="secondary">{supplierProductCounts[supplier.id] || 0}</Badge>
                      </div>
                      <div className="flex gap-1 justify-end md:justify-start">
                        <SupplierForm supplier={supplier} />
                        <Button variant="ghost" size="icon" onClick={() => setSupplierToDelete({ id: supplier.id, name: supplier.name })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!disposalProduct} onOpenChange={() => setDisposalProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Product Disposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark <strong>{disposalProduct?.name}</strong> for disposal? This will remove <strong>{disposalProduct?.quantity} units</strong> from stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisposal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Disposal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{supplierToDelete?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (supplierToDelete) { deleteSupplierMutation.mutate(supplierToDelete.id); setSupplierToDelete(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Stock;
