import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useSuppliers } from "@/hooks/useSuppliers";

interface SupplierMultiSelectProps {
  selectedIds: string[];
  primarySupplierId?: string;
  onSelectionChange: (ids: string[], primaryId?: string) => void;
  disabled?: boolean;
}

export function SupplierMultiSelect({
  selectedIds,
  primarySupplierId,
  onSelectionChange,
  disabled = false,
}: SupplierMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: suppliers = [], isLoading } = useSuppliers();

  const selectedSuppliers = suppliers.filter((s) => selectedIds.includes(s.id));

  const toggleSupplier = (supplierId: string) => {
    if (selectedIds.includes(supplierId)) {
      // Remove supplier
      const newIds = selectedIds.filter((id) => id !== supplierId);
      const newPrimary = primarySupplierId === supplierId ? newIds[0] : primarySupplierId;
      onSelectionChange(newIds, newPrimary);
    } else {
      // Add supplier
      const newIds = [...selectedIds, supplierId];
      // If this is the first supplier, make it primary
      const newPrimary = selectedIds.length === 0 ? supplierId : primarySupplierId;
      onSelectionChange(newIds, newPrimary);
    }
  };

  const setPrimary = (supplierId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedIds, supplierId);
  };

  const removeSupplier = (supplierId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIds = selectedIds.filter((id) => id !== supplierId);
    const newPrimary = primarySupplierId === supplierId ? newIds[0] : primarySupplierId;
    onSelectionChange(newIds, newPrimary);
  };

  const clearAll = () => {
    onSelectionChange([], undefined);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              "Loading suppliers..."
            ) : selectedIds.length === 0 ? (
              "Select suppliers..."
            ) : (
              `${selectedIds.length} supplier${selectedIds.length > 1 ? "s" : ""} selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search suppliers..." />
            <CommandList>
              <CommandEmpty>No suppliers found.</CommandEmpty>
              <CommandGroup>
                {suppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={supplier.name}
                    onSelect={() => toggleSupplier(supplier.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(supplier.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <span>{supplier.name}</span>
                      {supplier.contact_person && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({supplier.contact_person})
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected suppliers with primary indicator */}
      {selectedSuppliers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSuppliers.map((supplier) => (
            <Badge
              key={supplier.id}
              variant={supplier.id === primarySupplierId ? "default" : "secondary"}
              className="flex items-center gap-1 py-1 px-2"
            >
              {supplier.id === primarySupplierId && (
                <Star className="h-3 w-3 fill-current" />
              )}
              <span className="max-w-[120px] truncate">{supplier.name}</span>
              {selectedIds.length > 1 && supplier.id !== primarySupplierId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => setPrimary(supplier.id, e)}
                  title="Set as primary supplier"
                >
                  <Star className="h-3 w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                onClick={(e) => removeSupplier(supplier.id, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {selectedIds.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={clearAll}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {selectedIds.length > 1 && (
        <p className="text-xs text-muted-foreground">
          <Star className="h-3 w-3 inline fill-current" /> = Primary supplier
        </p>
      )}
    </div>
  );
}
