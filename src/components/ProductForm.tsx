import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, HelpCircle } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import { useCanAccessFinancialData } from "@/hooks/useUserRole";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  generic_name: z.string().optional(),
  brand: z.string().optional(),
  category: z.enum(["prescription", "otc", "supplement", "medical_device", "cosmetic"]),
  barcode: z.string().optional(),
  description: z.string().optional(),
  unit_price: z.number().min(0, "Price must be positive"),
  cost_price: z.number().min(0, "Cost must be positive").optional(),
  stock_quantity: z.number().min(0, "Stock must be non-negative"),
  minimum_stock: z.number().min(0, "Minimum stock must be non-negative"),
  expiry_date: z.string().optional(),
  batch_number: z.string().optional(),
  requires_prescription: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

const FieldTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const canAccessFinancialData = useCanAccessFinancialData();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      generic_name: product.generic_name || "",
      brand: product.brand || "",
      category: product.category,
      barcode: product.barcode || "",
      description: product.description || "",
      unit_price: product.unit_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      minimum_stock: product.minimum_stock,
      expiry_date: product.expiry_date || "",
      batch_number: product.batch_number || "",
      requires_prescription: product.requires_prescription,
    } : {
      name: "",
      generic_name: "",
      brand: "",
      category: "otc" as const,
      barcode: "",
      description: "",
      unit_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      minimum_stock: 0,
      expiry_date: "",
      batch_number: "",
      requires_prescription: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        name: data.name,
        generic_name: data.generic_name || null,
        brand: data.brand || null,
        category: data.category,
        barcode: data.barcode || null,
        description: data.description || null,
        unit_price: data.unit_price,
        cost_price: canAccessFinancialData ? data.cost_price : (product?.cost_price || 0),
        stock_quantity: data.stock_quantity,
        minimum_stock: data.minimum_stock,
        expiry_date: data.expiry_date || null,
        batch_number: data.batch_number || null,
        requires_prescription: data.requires_prescription,
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      toast({ 
        title: `Product ${product ? 'updated' : 'created'} successfully` 
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: `Error ${product ? 'updating' : 'creating'} product`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={product ? "ghost" : "default"} size={product ? "sm" : "default"}>
          {product ? (
            <Edit2 className="h-4 w-4" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        
        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Product Name *
                        <FieldTooltip content="The trade or brand name of the product as it appears on the packaging" />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="generic_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Generic Name
                        <FieldTooltip content="The active ingredient or non-proprietary name (e.g., Paracetamol for Panado)" />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Brand
                        <FieldTooltip content="The manufacturer or pharmaceutical company that produces the product" />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Category *
                        <FieldTooltip content="Product classification: Prescription (Schedule 3-6), OTC (over-the-counter), Supplement, Medical Device, or Cosmetic" />
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prescription">Prescription</SelectItem>
                          <SelectItem value="otc">Over the Counter</SelectItem>
                          <SelectItem value="supplement">Supplement</SelectItem>
                          <SelectItem value="medical_device">Medical Device</SelectItem>
                          <SelectItem value="cosmetic">Cosmetic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Barcode
                      <FieldTooltip content="The product's barcode number (EAN/UPC) for scanning at POS" />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Description
                      <FieldTooltip content="Additional product details such as dosage form, strength, pack size, or usage notes" />
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Unit Price (R) *
                        <FieldTooltip content="The selling price per unit charged to customers (including VAT if applicable)" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {canAccessFinancialData && (
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Cost Price (R) *
                          <FieldTooltip content="The purchase price paid to the supplier (used for profit margin calculations)" />
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Stock Quantity *
                        <FieldTooltip content="Current number of units available in inventory" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="minimum_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Minimum Stock *
                        <FieldTooltip content="Reorder threshold - you'll receive low stock alerts when quantity falls below this level" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Expiry Date
                        <FieldTooltip content="Product expiration date - you'll receive alerts for products expiring within 90 days" />
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="batch_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Batch Number
                        <FieldTooltip content="Manufacturer's batch or lot number for traceability and recall purposes" />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requires_prescription"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5 flex items-center">
                      <FormLabel>Requires Prescription</FormLabel>
                      <FieldTooltip content="Enable if this product can only be dispensed with a valid prescription (Schedule 3-6 medicines)" />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : (product ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
