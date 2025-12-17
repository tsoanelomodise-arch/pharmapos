import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";

interface ProductMultiSelectProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelection?: number;
}

export function ProductMultiSelect({ 
  selectedIds, 
  onSelectionChange, 
  maxSelection = 5 
}: ProductMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: products, isLoading } = useProducts();

  const selectedProducts = products?.filter(p => selectedIds.includes(p.id)) || [];

  const toggleProduct = (productId: string) => {
    if (selectedIds.includes(productId)) {
      onSelectionChange(selectedIds.filter(id => id !== productId));
    } else if (selectedIds.length < maxSelection) {
      onSelectionChange([...selectedIds, productId]);
    }
  };

  const removeProduct = (productId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== productId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[280px] justify-between"
            >
              {selectedIds.length === 0 
                ? "Select products to compare..." 
                : `${selectedIds.length} product${selectedIds.length > 1 ? 's' : ''} selected`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 z-50 bg-popover" align="start">
            <Command>
              <CommandInput placeholder="Search products..." />
              <CommandList>
                <CommandEmpty>No products found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {isLoading ? (
                    <CommandItem disabled>Loading products...</CommandItem>
                  ) : (
                    products?.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={() => toggleProduct(product.id)}
                        disabled={!selectedIds.includes(product.id) && selectedIds.length >= maxSelection}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIds.includes(product.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{product.name}</span>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Selected products badges */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <Badge key={product.id} variant="secondary" className="gap-1 pr-1">
              {product.name}
              <button
                onClick={() => removeProduct(product.id)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selectedIds.length >= maxSelection && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxSelection} products can be selected
        </p>
      )}
    </div>
  );
}
