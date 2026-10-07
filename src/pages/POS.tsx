import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Scan, CreditCard, Receipt, Trash2, Plus, Minus, User, X, RotateCcw, AlertTriangle } from "lucide-react";
import { useProductSearch } from "@/hooks/useProducts";
import { useCreateSaleMutation, useRecentSales } from "@/hooks/useSales";
import { useCustomerSearch } from "@/hooks/useCustomers";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "@/hooks/use-toast";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { CreditTransactionDialog } from "@/components/CreditTransactionDialog";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { AdumoPaymentDialog } from "@/components/AdumoPaymentDialog";
import { useAdumoSettings } from "@/hooks/useAdumoSettings";
import { AdumoTransactionResult } from "@/types/adumo";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  stock_quantity: number;
  minimum_stock: number;
}

const POS = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'insurance' | 'adumo'>('cash');
  const [cashPaid, setCashPaid] = useState<string>("");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [showLastReceipt, setShowLastReceipt] = useState(false);
  const [creditingSaleId, setCreditingSaleId] = useState<string | null>(null);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customDate, setCustomDate] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone?: string } | null>(null);
  const [adumoDialogOpen, setAdumoDialogOpen] = useState(false);
  const [adumoPendingReference, setAdumoPendingReference] = useState("");
  const [stockAlertOpen, setStockAlertOpen] = useState(false);
  const [shortageItems, setShortageItems] = useState<Array<{
    id: string;
    name: string;
    requested: number;
    available: number;
  }>>([]);
  const [isVerifyingStock, setIsVerifyingStock] = useState(false);
  const { settings: adumoSettings } = useAdumoSettings();
  
  const { data: searchResults = [] } = useProductSearch(searchTerm);
  const { data: recentSales = [] } = useRecentSales(5);
  const { data: customerResults = [] } = useCustomerSearch(customerSearchTerm);
  const { data: businessSettings } = useBusinessSettings();
  const createSaleMutation = useCreateSaleMutation();
  const { data: role } = useUserRole();
  const canViewTransactions = role === 'admin' || role === 'owner';
  const canCreditTransactions = role === 'admin' || role === 'owner';
  const canBackdateTransactions = role === 'admin' || role === 'owner';

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
          .select('id, name, unit_price, stock_quantity, minimum_stock')
          .in('id', productIds);
        
        const outOfStockMeds: string[] = [];
        const lowStockMeds: string[] = [];
        const adjustedMeds: string[] = [];
        const prescriptionItems: CartItem[] = [];

        medications.forEach((med: any) => {
          const productId = med.product_id || med.id;
          const product = products?.find(p => p.id === productId);
          
          const unitPrice = med.unit_price || product?.unit_price || 0;
          const requestedQty = med.quantity || 1;
          const availableStock = Number(product?.stock_quantity ?? 0);
          const minStock = Number(product?.minimum_stock ?? 0);
          const medName = med.name || product?.name || `Product ${productId}`;

          if (availableStock <= 0) {
            outOfStockMeds.push(medName);
            return;
          }

          let finalQty = requestedQty;
          if (requestedQty > availableStock) {
            finalQty = availableStock;
            adjustedMeds.push(`${medName} (requested: ${requestedQty}, added: ${availableStock})`);
          }

          if (availableStock <= minStock) {
            lowStockMeds.push(`${medName} (${availableStock} left)`);
          }
          
          prescriptionItems.push({
            id: productId,
            name: medName,
            price: unitPrice,
            quantity: finalQty,
            total: unitPrice * finalQty,
            stock_quantity: availableStock,
            minimum_stock: minStock
          });
        });
        
        setCartItems(prescriptionItems);

        if (outOfStockMeds.length > 0) {
          toast({
            title: "Out of stock items excluded",
            description: `Prescribed item(s) currently out of stock: ${outOfStockMeds.join(', ')}`,
            variant: "destructive"
          });
        }

        if (adjustedMeds.length > 0) {
          toast({
            title: "Not enough stock",
            description: `Quantities capped at shelf stock: ${adjustedMeds.join('; ')}`,
            variant: "destructive"
          });
        }

        if (lowStockMeds.length > 0) {
          toast({
            title: "Low stock warning",
            description: `Item(s) at or below minimum stock: ${lowStockMeds.join(', ')}`,
          });
        }

        if (prescriptionItems.length > 0) {
          toast({
            title: "Prescription loaded",
            description: `${prescriptionItems.length} medication(s) added for ${prescription.customers?.name || 'patient'}`
          });
        }
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
    const availableStock = Number(product.stock_quantity ?? 0);
    const minStock = Number(product.minimum_stock ?? 0);

    // 1. Refuse to add an out-of-stock item and show an "Out of stock" message
    if (availableStock <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock. Cannot add to cart.`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cartItems.find(item => item.id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;

      // 2. Stop the quantity going above what's on the shelf ("Not enough stock")
      if (newQuantity > availableStock) {
        toast({
          title: "Not enough stock",
          description: `Cannot add more. Only ${availableStock} unit${availableStock === 1 ? '' : 's'} on the shelf for ${product.name}.`,
          variant: "destructive"
        });
        return;
      }

      // 3. Warn you when an item you add is at or below its minimum stock level
      if (availableStock <= minStock) {
        toast({
          title: "Low stock warning",
          description: `Warning: ${product.name} is at or below minimum stock level (${availableStock} remaining, minimum: ${minStock}).`,
        });
      } else if (availableStock - newQuantity <= minStock) {
        toast({
          title: "Low stock warning",
          description: `Warning: Adding ${product.name} brings shelf stock to or below minimum level (${availableStock - newQuantity} left, minimum: ${minStock}).`,
        });
      }

      updateQuantity(product.id, newQuantity);
    } else {
      // 3. Warn you when an item you add is at or below its minimum stock level
      if (availableStock <= minStock) {
        toast({
          title: "Low stock warning",
          description: `Warning: ${product.name} is at or below minimum stock level (${availableStock} remaining, minimum: ${minStock}).`,
        });
      } else if (availableStock - 1 <= minStock) {
        toast({
          title: "Low stock warning",
          description: `Warning: Adding ${product.name} brings shelf stock to or below minimum level (${availableStock - 1} left, minimum: ${minStock}).`,
        });
      }

      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.unit_price,
        quantity: 1,
        total: product.unit_price,
        stock_quantity: availableStock,
        minimum_stock: minStock
      };
      setCartItems(prev => [...prev, newItem]);
    }
    setSearchTerm("");
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const availableStock = item.stock_quantity ?? 0;

    // Stop the quantity going above what's on the shelf ("Not enough stock")
    if (newQuantity > availableStock) {
      toast({
        title: "Not enough stock",
        description: `Cannot increase quantity. Only ${availableStock} unit${availableStock === 1 ? '' : 's'} on the shelf for ${item.name}.`,
        variant: "destructive"
      });
      return;
    }
    
    setCartItems(prev => 
      prev.map(i => 
        i.id === id 
          ? { ...i, quantity: newQuantity, total: i.price * newQuantity }
          : i
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

  const handleBarcodeSearch = async () => {
    const term = searchTerm.trim();
    if (!term) {
      toast({ title: "Enter barcode", description: "Please enter a barcode or product name to search" });
      return;
    }

    if (searchResults.length === 1) {
      addToCart(searchResults[0]);
      return;
    }

    // Direct lookup in case search query hasn't debounced yet
    const sanitized = term.replace(/[%_\\]/g, '\\$&').trim().slice(0, 100);
    const { data: directResults } = await supabase
      .from('products')
      .select('*')
      .or(`barcode.eq.${sanitized},name.ilike.%${sanitized}%`)
      .limit(2);

    if (directResults && directResults.length === 1) {
      addToCart(directResults[0]);
    } else if (searchResults.length > 1) {
      toast({ title: "Multiple matches", description: "Please select the desired product from the search list below." });
    } else if (searchResults.length === 0 && (!directResults || directResults.length === 0)) {
      toast({ title: "Product not found", description: `No product found matching "${term}"`, variant: "destructive" });
    }
  };

  const completeSale = (method: 'cash' | 'card' | 'credit' | 'insurance', adumoResult?: AdumoTransactionResult) => {
    const items = cartItems.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price
    }));

    let saleNotes = '';
    if (activePrescription) {
      saleNotes = `Prescription dispensed - Dr. ${activePrescription.doctor_name}`;
    } else if (selectedCustomer) {
      saleNotes = `POS Sale - ${selectedCustomer.name}`;
    } else {
      saleNotes = `POS Sale - ${method} payment`;
    }

    if (adumoResult) {
      saleNotes += ` | Adumo Terminal: ${adumoResult.terminalId || 'PED'} | Auth: ${adumoResult.authCode || 'OK'} | Ref: ${adumoResult.reference} | Card: ${adumoResult.maskedPan || adumoResult.cardScheme || 'CARD'}`;
    }

    createSaleMutation.mutate({
      items,
      paymentMethod: method,
      customerId: activePrescription?.customer_id || selectedCustomer?.id,
      prescriptionId: activePrescription?.id,
      cashPaid: method === 'cash' ? cashAmount : undefined,
      changeGiven: method === 'cash' ? changeAmount : undefined,
      vatRate,
      vatInclusive,
      createdAt: canBackdateTransactions && customDate ? new Date(customDate).toISOString() : undefined,
      notes: saleNotes,
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
        setCustomDate("");
        setActivePrescription(null);
        setSelectedCustomer(null);
        setCustomerSearchTerm("");
        toast({
          title: "Payment processed successfully!", 
          description: method === 'cash' 
            ? `Change: R${changeAmount.toFixed(2)} - Receipt ready to print`
            : `Transaction #${sale.id.slice(-8)} completed - Receipt ready to print`
        });
      }
    });
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

    // Check stock levels again right before payment.
    // If another till sold the last units in the meantime, it shall list the items that are short and cancels the sale.
    setIsVerifyingStock(true);
    try {
      const productIds = cartItems.map(item => item.id);
      // Retry on brief connection drops ("Failed to fetch") before giving up
      let freshProducts: Array<{ id: string; name: string; stock_quantity: number | null; minimum_stock: number | null }> | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id, name, stock_quantity, minimum_stock')
            .in('id', productIds);
          if (error) throw error;
          freshProducts = data;
          lastErr = null;
          break;
        } catch (e: any) {
          lastErr = e;
          const isNetwork = /failed to fetch|network|load failed/i.test(String(e?.message ?? e));
          if (!isNetwork) break;
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      if (lastErr) {
        const isNetwork = /failed to fetch|network|load failed/i.test(String(lastErr?.message ?? lastErr));
        throw new Error(
          isNetwork
            ? "Connection to the server was lost. Check the internet connection and press Process Payment again — the cart has been kept."
            : lastErr.message
        );
      }

      // Update cartItems with latest available stock and detect shortages
      const freshMap = new Map<string, { stock_quantity: number; minimum_stock: number; name: string }>();
      freshProducts?.forEach(p => {
        freshMap.set(p.id, {
          stock_quantity: Number(p.stock_quantity ?? 0),
          minimum_stock: Number(p.minimum_stock ?? 0),
          name: p.name,
        });
      });

      setCartItems(prev =>
        prev.map(item => {
          const fresh = freshMap.get(item.id);
          return fresh
            ? { ...item, stock_quantity: fresh.stock_quantity, minimum_stock: fresh.minimum_stock }
            : item;
        })
      );

      const short: Array<{ id: string; name: string; requested: number; available: number }> = [];

      for (const item of cartItems) {
        const fresh = freshMap.get(item.id);
        const available = fresh ? fresh.stock_quantity : 0;
        if (available < item.quantity) {
          short.push({
            id: item.id,
            name: item.name,
            requested: item.quantity,
            available
          });
        }
      }

      if (short.length > 0) {
        // List items that are short and cancel the sale
        setShortageItems(short);
        setStockAlertOpen(true);

        const shortSummary = short
          .map(i => `${i.name} (requested: ${i.requested}, available: ${i.available})`)
          .join(', ');

        toast({
          title: "Sale Cancelled - Insufficient Stock",
          description: `Another till or sale reduced stock in the meantime. Short items: ${shortSummary}`,
          variant: "destructive"
        });

        return; // Sale cancelled! Do not proceed to payment.
      }
    } catch (err: any) {
      toast({
        title: "Stock verification failed",
        description: err.message || "Could not verify live stock levels before payment. Please try again.",
        variant: "destructive"
      });
      return;
    } finally {
      setIsVerifyingStock(false);
    }

    if (paymentMethod === 'cash') {
      completeSale('cash');
      return;
    }

    // Intercept Adumo payment
    if (paymentMethod === 'adumo') {
      const generatedRef = `ADUMO-${Date.now().toString().slice(-6)}`;
      setAdumoPendingReference(generatedRef);
      setAdumoDialogOpen(true);
      return;
    }

    completeSale(paymentMethod as 'card' | 'credit' | 'insurance');
  };

  const handleAdumoSuccess = (result: AdumoTransactionResult) => {
    completeSale('card', result);
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
          {/* Patient Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Patient (Optional)
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeSearch();
                      }
                    }}
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
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        product.stock_quantity > 0 ? "hover:bg-accent" : "opacity-75 hover:bg-destructive/10"
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          {product.stock_quantity > 0 && product.stock_quantity <= (product.minimum_stock ?? 0) && (
                            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-[10px] px-1.5 py-0">
                              Low Stock
                            </Badge>
                          )}
                        </div>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.stock_quantity <= (item.minimum_stock ?? 0) && (
                          <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-xs">
                            Low Stock ({item.stock_quantity} left)
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        R{(item.price || 0).toFixed(2)} each &bull; <span className="text-xs">Shelf: {item.stock_quantity}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity || 0}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        title={item.quantity >= item.stock_quantity ? "Cannot exceed stock on shelf" : "Add one"}
                      >
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
          {canViewTransactions && (
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
                      {canCreditTransactions
                        && !sale.credit_note_for
                        && sale.payment_status !== 'credited'
                        && sale.total_amount >= 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Credit transaction"
                          className="text-amber-600 hover:text-amber-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreditingSaleId(sale.id);
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
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
          )}
        </div>

        {/* Payment & Checkout */}
        <div className="space-y-6">

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
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button 
                    variant={paymentMethod === 'adumo' ? 'default' : 'outline'} 
                    className="h-16 border-primary/40 hover:border-primary"
                    onClick={() => setPaymentMethod('adumo')}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold text-primary">Adumo</span>
                      </div>
                      <span className="text-xs font-medium">Smart Card</span>
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
                    variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                    className="h-16"
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="text-center">
                      <CreditCard className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">Standard Card</span>
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

              {canBackdateTransactions && (
                <div className="space-y-2">
                  <Label htmlFor="custom-date">Transaction Date &amp; Time (optional)</Label>
                  <Input
                    id="custom-date"
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use the current date and time.
                  </p>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg" 
                disabled={
                  cartItems.length === 0 || 
                  isVerifyingStock ||
                  createSaleMutation.isPending ||
                  (paymentMethod === 'cash' && (!cashPaid || cashAmount < total))
                }
                onClick={processPayment}
              >
                {isVerifyingStock 
                  ? 'Verifying stock...' 
                  : createSaleMutation.isPending 
                    ? 'Processing...' 
                    : 'Process Payment'}
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
      {/* Credit Transaction Dialog */}
      <CreditTransactionDialog
        saleId={creditingSaleId}
        open={!!creditingSaleId}
        onOpenChange={(open) => !open && setCreditingSaleId(null)}
      />

      {/* Adumo Payment Terminal Dialog */}
      <AdumoPaymentDialog
        open={adumoDialogOpen}
        onOpenChange={setAdumoDialogOpen}
        amount={total}
        customerName={activePrescription?.customers?.name || selectedCustomer?.name}
        reference={adumoPendingReference}
        settings={adumoSettings}
        onSuccess={handleAdumoSuccess}
      />

      {/* Stock Shortage / Sale Cancelled Dialog */}
      <AlertDialog open={stockAlertOpen} onOpenChange={setStockAlertOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Sale Cancelled - Insufficient Stock
            </AlertDialogTitle>
            <AlertDialogDescription>
              Another till or transaction sold units in the meantime. The requested quantity is no longer available on the shelf, so this sale has been cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-2">
            <p className="text-sm font-semibold text-foreground">Items that are short:</p>
            <div className="border rounded-md divide-y max-h-56 overflow-y-auto bg-muted/20">
              {shortageItems.map((item) => (
                <div key={item.id} className="p-3 text-sm flex justify-between items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: <span className="font-semibold text-foreground">{item.requested}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.available <= 0 ? "destructive" : "secondary"}>
                      {item.available <= 0 ? "0 on shelf (Out of stock)" : `Only ${item.available} on shelf`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogAction
              onClick={() => {
                // Adjust cart items to currently available stock
                setCartItems(prev =>
                  prev
                    .map(item => {
                      const short = shortageItems.find(s => s.id === item.id);
                      if (!short) return item;
                      if (short.available <= 0) return null;
                      return {
                        ...item,
                        quantity: short.available,
                        total: item.price * short.available,
                        stock_quantity: short.available,
                      };
                    })
                    .filter(Boolean) as CartItem[]
                );
                setStockAlertOpen(false);
                toast({
                  title: "Cart adjusted",
                  description: "Quantities updated to current shelf stock. Out-of-stock items removed.",
                });
              }}
            >
              Adjust Cart to Available
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setStockAlertOpen(false)}>
              Dismiss
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default POS;