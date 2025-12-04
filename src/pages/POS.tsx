import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Scan, CreditCard, Receipt, Trash2, Plus, Minus, User, X } from "lucide-react";
import { useProductSearch } from "@/hooks/useProducts";
import { useCreateSaleMutation, useRecentSales } from "@/hooks/useSales";
import { useCustomerSearch } from "@/hooks/useCustomers";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

const POS = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'insurance'>('cash');
  const [cashPaid, setCashPaid] = useState<string>("");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [showLastReceipt, setShowLastReceipt] = useState(false);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone?: string } | null>(null);
  
  const { data: searchResults = [] } = useProductSearch(searchTerm);
  const { data: recentSales = [] } = useRecentSales(5);
  const { data: customerResults = [] } = useCustomerSearch(customerSearchTerm);
  const { data: businessSettings } = useBusinessSettings();
  const createSaleMutation = useCreateSaleMutation();

  // Pre-populate cart from prescription
  useEffect(() => {
    const prescription = location.state?.prescription;
    if (prescription && prescription.medications) {
      setActivePrescription(prescription);
      
      // Fetch product details for medications
      const loadPrescriptionItems = async () => {
        const medications = Array.isArray(prescription.medications) 
          ? prescription.medications 
          : typeof prescription.medications === 'string'
            ? JSON.parse(prescription.medications)
            : [];
        
        // Get product IDs from medications
        const productIds = medications
          .map((med: any) => med.product_id || med.id)
          .filter(Boolean);
        
        if (productIds.length === 0) {
          toast({
            title: "No medications found",
            description: "This prescription doesn't have any medications",
            variant: "destructive"
          });
          return;
        }
        
        const { data: products } = await supabase
          .from('products')
          .select('id, name, unit_price')
          .in('id', productIds);
        
        const prescriptionItems: CartItem[] = medications.map((med: any) => {
          const productId = med.product_id || med.id;
          const product = products?.find(p => p.id === productId);
          
          // Use stored price or fetch from product
          const unitPrice = med.unit_price || product?.unit_price || 0;
          const quantity = med.quantity || 1;
          
          return {
            id: productId,
            name: med.name || product?.name || `Product ${productId}`,
            price: unitPrice,
            quantity: quantity,
            total: unitPrice * quantity
          };
        });
        
        setCartItems(prescriptionItems);
        toast({
          title: "Prescription loaded",
          description: `${prescriptionItems.length} medication(s) added for ${prescription.customers?.name || 'patient'}`
        });
      };
      
      loadPrescriptionItems();
    }
  }, [location.state]);

  const vatRate = businessSettings?.vat_rate ?? 15;
  const vatInclusive = businessSettings?.vat_inclusive ?? false;
  
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate VAT based on inclusive/exclusive mode
  const tax = vatInclusive 
    ? subtotal - (subtotal / (1 + vatRate / 100)) // Extract VAT from inclusive price
    : subtotal * (vatRate / 100); // Add VAT to exclusive price
  
  const total = vatInclusive ? subtotal : subtotal + tax;
  const cashAmount = parseFloat(cashPaid) || 0;
  const changeAmount = cashAmount - total;

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
    setCashPaid("");
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setActivePrescription(null);
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

    // Validate cash payment
    if (paymentMethod === 'cash') {
      if (!cashPaid || cashAmount < total) {
        toast({ 
          title: "Insufficient cash", 
          description: `Amount paid (R${cashAmount.toFixed(2)}) is less than total (R${total.toFixed(2)})`,
          variant: "destructive"
        });
        return;
      }
    }

    const items = cartItems.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price
    }));

    createSaleMutation.mutate({
      items,
      paymentMethod,
      customerId: activePrescription?.customer_id || selectedCustomer?.id,
      prescriptionId: activePrescription?.id,
      cashPaid: paymentMethod === 'cash' ? cashAmount : undefined,
      changeGiven: paymentMethod === 'cash' ? changeAmount : undefined,
      vatRate,
      vatInclusive,
      notes: activePrescription 
        ? `Prescription dispensed - Dr. ${activePrescription.doctor_name}` 
        : selectedCustomer 
          ? `POS Sale - ${selectedCustomer.name}` 
          : `POS Sale - ${paymentMethod} payment`
    }, {
      onSuccess: async (sale) => {
        // Update prescription status if this was a prescription sale
        if (activePrescription) {
          await supabase
            .from('prescriptions')
            .update({ 
              status: 'dispensed',
              dispensed_at: new Date().toISOString()
            })
            .eq('id', activePrescription.id);
          
          queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
          queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
        }
        
        setLastSaleId(sale.id);
        setShowLastReceipt(true);
        clearCart();
        setCashPaid("");
        setActivePrescription(null);
        setSelectedCustomer(null);
        setCustomerSearchTerm("");
        toast({
          title: "Payment processed successfully!", 
          description: paymentMethod === 'cash' 
            ? `Change: R${changeAmount.toFixed(2)} - Receipt ready to print`
            : `Transaction #${sale.id.slice(-8)} completed - Receipt ready to print`
        });
      }
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Point of Sale</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowLastReceipt(true)}
            disabled={!lastSaleId}
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Receipt className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Last </span>Receipt
          </Button>
          <Button onClick={startNewSale} size="sm" className="text-xs sm:text-sm">New Sale</Button>
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
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">R{(item.price || 0).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity || 0}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">R{(item.total || 0).toFixed(2)}</p>
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

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Transactions</CardTitle>
              <Link to="/pos/transactions" className="text-sm text-primary hover:underline">
                View All →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setLastSaleId(sale.id);
                      setShowLastReceipt(true);
                    }}
                  >
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
                        onClick={(e) => {
                          e.stopPropagation();
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
        </div>

        {/* Payment & Checkout */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Customer (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearchTerm("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search customer..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <QuickPatientForm 
                      onSuccess={(customer) => {
                        setSelectedCustomer({
                          id: customer.id,
                          name: customer.name,
                          phone: customer.phone || undefined
                        });
                      }}
                    />
                  </div>
                  {customerResults.length > 0 && (
                    <div className="border rounded-lg max-h-32 overflow-y-auto">
                      {customerResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-2 hover:bg-accent cursor-pointer text-sm"
                          onClick={() => {
                            setSelectedCustomer({
                              id: customer.id,
                              name: customer.name,
                              phone: customer.phone || undefined
                            });
                            setCustomerSearchTerm("");
                          }}
                        >
                          <p className="font-medium">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-muted-foreground text-xs">{customer.phone}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {vatInclusive ? (
                  <>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total (VAT Incl.):</span>
                      <span>R{subtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      Includes R{tax.toFixed(2)} VAT ({vatRate}%)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({vatRate}%):</span>
                      <span>R{tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>R{total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Payment Method</h4>
                
                {paymentMethod === 'cash' && (
                  <div className="space-y-2 p-3 bg-accent rounded-lg">
                    <Label htmlFor="cash-paid">Cash Paid</Label>
                    <Input
                      id="cash-paid"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cashPaid}
                      onChange={(e) => setCashPaid(e.target.value)}
                      className="text-lg"
                    />
                    {cashPaid && cashAmount >= total && (
                      <div className="text-sm">
                        <div className="flex justify-between font-medium text-primary">
                          <span>Change:</span>
                          <span>R{changeAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    {cashPaid && cashAmount < total && (
                      <p className="text-sm text-destructive">
                        Insufficient amount (need R{(total - cashAmount).toFixed(2)} more)
                      </p>
                    )}
                  </div>
                )}
                
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
                disabled={
                  cartItems.length === 0 || 
                  createSaleMutation.isPending ||
                  (paymentMethod === 'cash' && (!cashPaid || cashAmount < total))
                }
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