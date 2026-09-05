import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PackagePlus, Search } from "lucide-react";
import { useLowStockProducts, useBulkRestockMutation, useRestockMutation } from "@/hooks/useProducts";

export function RestockDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const bulkRestockMutation = useBulkRestockMutation();
  const restockMutation = useRestockMutation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredProducts = lowStockProducts.filter(product => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      product.name.toLowerCase().includes(term) ||
      (product.generic_name && product.generic_name.toLowerCase().includes(term)) ||
      (product.barcode && product.barcode.includes(term))
    );
  });

  const handleQuantityChange = (productId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const handleRestockAll = () => {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    
    if (items.length === 0) return;
    
    bulkRestockMutation.mutate(items, {
      onSuccess: () => {
        setQuantities({});
        setOpen(false);
      }
    });
  };

  const handleRestockSingle = (productId: string) => {
    const qty = quantities[productId];
    if (!qty || qty <= 0) return;
    
    restockMutation.mutate({ productId, quantity: qty }, {
      onSuccess: () => {
        setQuantities(prev => ({ ...prev, [productId]: 0 }));
      }
    });
  };

  const hasItems = Object.values(quantities).some(q => q > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuantities({}); setSearchTerm(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackagePlus className="h-4 w-4 mr-2" />
          Restock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Restock Low & Out-of-Stock Items</DialogTitle>
        </DialogHeader>

        {lowStockProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All products are well stocked!
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name, barcode, or generic name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>Product</div>
              <div>Stock</div>
              <div>Min</div>
              <div>Restock Qty</div>
              <div></div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No products match "{searchTerm}".
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-2 items-center text-sm p-2 border rounded-lg">
                    <div>
                      <p className="font-medium truncate">{product.name}</p>
                      <Badge variant={product.stock_quantity === 0 ? "destructive" : "outline"} className="text-xs mt-1">
                        {product.stock_quantity === 0 ? "Out" : "Low"}
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
                      disabled={!quantities[product.id] || quantities[product.id] <= 0 || restockMutation.isPending}
                      onClick={() => handleRestockSingle(product.id)}
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
                disabled={!hasItems || bulkRestockMutation.isPending}
              >
                {bulkRestockMutation.isPending ? "Restocking..." : "Restock All"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
