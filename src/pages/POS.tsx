import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Scan, CreditCard, Receipt, Trash2, Plus, Minus, Search } from "lucide-react";
import { useProductSearch } from "@/hooks/useProducts";
import { useCreateSaleMutation, useRecentSales } from "@/hooks/useSales";
import { toast } from "@/hooks/use-toast";
import { ReceiptDialog } from "@/components/ReceiptDialog";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

const POS = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'insurance'>('cash');
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [showLastReceipt, setShowLastReceipt] = useState(false);
  
  const { data: searchResults = [] } = useProductSearch(searchTerm);
  const { data: recentSales = [] } = useRecentSales(5);
  const createSaleMutation = useCreateSaleMutation();

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.unit_price,
        quantity: 1,
        total: product.unit_price
      };
      setCartItems(prev => [...prev, newItem]);
    }
    setSearchTerm("");
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const startNewSale = () => {
    clearCart();
    setSearchTerm("");
    setPaymentMethod('cash');
    toast({ title: "New sale started", description: "Cart cleared and ready for new transaction" });
  };

  const handleBarcodeSearch = () => {
    if (!searchTerm.trim()) {
      toast({ title: "Enter barcode", description: "Please enter a barcode or product name to search" });
      return;
    }
    // The search will be triggered automatically by the searchTerm change
    if (searchResults.length === 1) {
      addToCart(searchResults[0]);
    }
  };

  const processPayment = async () => {
    if (cartItems.length === 0) return;

    const items = cartItems.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price
    }));

    createSaleMutation.mutate({
      items,
      paymentMethod,
      notes: `POS Sale - ${paymentMethod} payment`
    }, {
      onSuccess: (sale) => {
        setLastSaleId(sale.id);
        clearCart();
        toast({ 
          title: "Payment processed successfully!", 
          description: `Transaction #${sale.id.slice(-8)} completed`
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowLastReceipt(true)}
            disabled={!lastSaleId}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Last Receipt
          </Button>
          <Button onClick={startNewSale}>New Sale</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & Cart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="product-search">Scan barcode or search product</Label>
                  <Input
                    id="product-search"
                    placeholder="Scan barcode or type product name..."
                    className="text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button size="lg" className="mt-6" onClick={handleBarcodeSearch}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border rounded-lg p-2 bg-background max-h-40 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R{product.unit_price.toFixed(2)}</p>
                        <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                          {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">R{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">R{item.total.toFixed(2)}</p>
                      <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {cartItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cart is empty</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment & Checkout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span>R{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Payment Method</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                    className="h-16"
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="text-center">
                      <CreditCard className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">Card</span>
                    </div>
                  </Button>
                  <Button 
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                    className="h-16"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="text-center">
                      <span className="text-lg mb-1">💰</span>
                      <div className="text-xs">Cash</div>
                    </div>
                  </Button>
                  <Button 
                    variant={paymentMethod === 'insurance' ? 'default' : 'outline'} 
                    className="h-16"
                    onClick={() => setPaymentMethod('insurance')}
                  >
                    <div className="text-center">
                      <span className="text-lg mb-1">🏥</span>
                      <div className="text-xs">Medical Aid</div>
                    </div>
                  </Button>
                  <Button 
                    variant={paymentMethod === 'credit' ? 'default' : 'outline'} 
                    className="h-16"
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <div className="text-center">
                      <span className="text-lg mb-1">📱</span>
                      <div className="text-xs">Credit</div>
                    </div>
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-lg" 
                disabled={cartItems.length === 0 || createSaleMutation.isPending}
                onClick={processPayment}
              >
                {createSaleMutation.isPending ? 'Processing...' : 'Process Payment'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowLastReceipt(true)}
                disabled={!lastSaleId}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Reprint Receipt
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Hold Transaction
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={clearCart}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <div>
                  <p className="font-medium">Transaction #{sale.id.slice(-8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(sale.created_at).toLocaleTimeString()} - {sale.payment_method} Payment
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="font-medium">R{sale.total_amount.toFixed(2)}</p>
                    <Badge variant="secondary">{sale.payment_status}</Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setLastSaleId(sale.id);
                      setShowLastReceipt(true);
                    }}
                  >
                    <Receipt className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {recentSales.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      {lastSaleId && (
        <ReceiptDialog
          saleId={lastSaleId}
          open={showLastReceipt}
          onOpenChange={setShowLastReceipt}
        />
      )}
    </div>
  );
};

export default POS;