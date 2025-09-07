import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Scan, CreditCard, Receipt, Trash2, Plus, Minus } from "lucide-react";

const POS = () => {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Paracetamol 500mg", price: 12.50, quantity: 2, total: 25.00 },
    { id: 2, name: "Vitamin C 1000mg", price: 89.99, quantity: 1, total: 89.99 },
  ]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Receipt className="mr-2 h-4 w-4" />
            Last Receipt
          </Button>
          <Button>New Sale</Button>
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
                  />
                </div>
                <Button size="lg" className="mt-6">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
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
                      <Button size="sm" variant="outline">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">R{item.total.toFixed(2)}</p>
                      <Button size="sm" variant="ghost">
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
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <CreditCard className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">Card</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <span className="text-lg mb-1">💰</span>
                      <div className="text-xs">Cash</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <span className="text-lg mb-1">🏥</span>
                      <div className="text-xs">Medical Aid</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <span className="text-lg mb-1">📱</span>
                      <div className="text-xs">Mobile</div>
                    </div>
                  </Button>
                </div>
              </div>

              <Button className="w-full h-12 text-lg" disabled={cartItems.length === 0}>
                Process Payment
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                Reprint Receipt
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Hold Transaction
              </Button>
              <Button variant="outline" className="w-full justify-start">
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
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Transaction #12345</p>
                <p className="text-sm text-muted-foreground">10:30 AM - Card Payment</p>
              </div>
              <div className="text-right">
                <p className="font-medium">R145.75</p>
                <Badge variant="secondary">Completed</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Transaction #12344</p>
                <p className="text-sm text-muted-foreground">10:15 AM - Cash Payment</p>
              </div>
              <div className="text-right">
                <p className="font-medium">R89.50</p>
                <Badge variant="secondary">Completed</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default POS;