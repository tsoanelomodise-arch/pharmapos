import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PackagePlus, Search, FileText, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, useLowStockProducts, useDocumentedBulkRestockMutation } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUserRole } from "@/hooks/useUserRole";

export function RestockDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: userRole } = useUserRole();
  const canRestock = userRole === 'admin' || userRole === 'owner' || userRole === 'restock';
  const [showAll, setShowAll] = useState(false);
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const { data: allProducts = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const documentedRestockMutation = useDocumentedBulkRestockMutation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [deliveryNoteFile, setDeliveryNoteFile] = useState<File | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const deliveryNoteInputRef = useRef<HTMLInputElement>(null);

  const baseProducts = canRestock && showAll ? allProducts : lowStockProducts;

  const normalizedTerm = searchTerm.toLowerCase().trim();
  const filteredProducts = useMemo(() => {
    if (!normalizedTerm) return baseProducts;
    return baseProducts.filter(product =>
      product.name.toLowerCase().startsWith(normalizedTerm) ||
      (product.generic_name && product.generic_name.toLowerCase().startsWith(normalizedTerm)) ||
      (product.barcode && product.barcode.startsWith(normalizedTerm))
    );
  }, [baseProducts, normalizedTerm]);

  const selectedSupplierName = useMemo(() => {
    if (!supplierId) return "";
    return suppliers.find(s => s.id === supplierId)?.name || "";
  }, [supplierId, suppliers]);

  const handleQuantityChange = (productId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const handleRestockAll = () => {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    
    if (items.length === 0) return;
    
    documentedRestockMutation.mutate({
      items,
      supplierId: supplierId || undefined,
      supplierName: selectedSupplierName,
      invoiceNumber: invoiceNumber || undefined,
      deliveryNoteNumber: deliveryNoteNumber || undefined,
      invoiceFile,
      deliveryNoteFile,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setQuantities({});
        setSupplierId("");
        setInvoiceNumber("");
        setDeliveryNoteNumber("");
        setNotes("");
        setInvoiceFile(null);
        setDeliveryNoteFile(null);
        setOpen(false);
      }
    });
  };

  const hasItems = Object.values(quantities).some(q => q > 0);

  const resetState = () => {
    setQuantities({});
    setSearchTerm("");
    setShowAll(false);
    setSupplierId("");
    setInvoiceNumber("");
    setDeliveryNoteNumber("");
    setNotes("");
    setInvoiceFile(null);
    setDeliveryNoteFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackagePlus className="h-4 w-4 mr-2" />
          Restock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl leading-tight">
            {canRestock && showAll ? "Restock Inventory Items" : "Restock Low & Out-of-Stock Items"}
          </DialogTitle>
        </DialogHeader>

        {baseProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All products are well stocked!
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search by product name, barcode, or generic name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {canRestock && (
              <div className="flex items-center gap-2">
                <Switch id="show-all-products" checked={showAll} onCheckedChange={setShowAll} />
                <Label htmlFor="show-all-products" className="text-sm text-muted-foreground">
                  Show all products (not just low stock)
                </Label>
              </div>
            )}

            <div className="grid gap-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Supplier &amp; Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restock-supplier">Supplier</Label>
                  <Select value={supplierId || "none"} onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}>
                    <SelectTrigger id="restock-supplier">
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    placeholder="INV-0001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-note-number">Delivery Note Number</Label>
                  <Input
                    id="delivery-note-number"
                    placeholder="DN-0001"
                    value={deliveryNoteNumber}
                    onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-file">Invoice File</Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={invoiceInputRef}
                      id="invoice-file"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => invoiceInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {invoiceFile ? "Change" : "Upload"}
                    </Button>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {invoiceFile ? invoiceFile.name : "PDF or image"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-note-file">Delivery Note File</Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={deliveryNoteInputRef}
                      id="delivery-note-file"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setDeliveryNoteFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => deliveryNoteInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {deliveryNoteFile ? "Change" : "Upload"}
                    </Button>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {deliveryNoteFile ? deliveryNoteFile.name : "PDF or image"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restock-notes">Notes</Label>
                <Textarea
                  id="restock-notes"
                  placeholder="Any additional details about this replenishment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>Product</div>
              <div>Stock</div>
              <div>Min</div>
              <div>Restock Qty</div>
              <div></div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No products match &quot;{searchTerm}&quot;.
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-2 items-center text-sm p-2 border rounded-lg">
                    <div>
                      <p className="font-medium truncate">{product.name}</p>
                      <Badge variant={product.stock_quantity === 0 ? "destructive" : "outline"} className="text-xs mt-1">
                        {product.stock_quantity === 0 ? "Out" : product.stock_quantity <= product.minimum_stock ? "Low" : "In stock"}
                      </Badge>
                    </div>
                    <div>{product.stock_quantity}</div>
                    <div>{product.minimum_stock}</div>
                    <Input
                      type="number"
                      min={0}
                      value={quantities[product.id] || ""}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      placeholder="0"
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!quantities[product.id] || quantities[product.id] <= 0 || documentedRestockMutation.isPending}
                      onClick={() => {
                        const qty = quantities[product.id];
                        if (!qty || qty <= 0) return;
                        documentedRestockMutation.mutate({
                          items: [{ productId: product.id, quantity: qty }],
                          supplierId: supplierId || undefined,
                          supplierName: selectedSupplierName,
                          invoiceNumber: invoiceNumber || undefined,
                          deliveryNoteNumber: deliveryNoteNumber || undefined,
                          invoiceFile,
                          deliveryNoteFile,
                          notes: notes || undefined,
                        }, {
                          onSuccess: () => {
                            setQuantities(prev => ({ ...prev, [product.id]: 0 }));
                          }
                        });
                      }}
                    >
                      Restock
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <Button
                onClick={handleRestockAll}
                disabled={!hasItems || documentedRestockMutation.isPending}
              >
                {documentedRestockMutation.isPending ? "Restocking..." : "Restock All"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
