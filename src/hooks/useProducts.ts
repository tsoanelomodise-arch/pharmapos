import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  generic_name?: string;
  brand?: string;
  category: 'prescription' | 'otc' | 'supplement' | 'medical_device' | 'cosmetic';
  barcode?: string;
  description?: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  minimum_stock: number;
  expiry_date?: string;
  batch_number?: string;
  supplier_id?: string;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      // Fetch all products and filter client-side since Supabase doesn't support column-to-column comparison
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock_quantity');
      
      if (error) throw error;
      
      // Filter products where stock_quantity <= minimum_stock
      const lowStock = (data as Product[]).filter(
        product => product.stock_quantity <= product.minimum_stock
      );
      
      return lowStock;
    }
  });
}

// Helper function to sanitize search terms and prevent SQL injection
const sanitizeSearchTerm = (term: string): string => {
  // Escape special ILIKE characters (%, _, \) and limit length
  return term.replace(/[%_\\]/g, '\\$&').trim().slice(0, 100);
};

export function useProductSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 1) return [];
      
      // Validate input format before querying
      if (!/^[a-zA-Z0-9\s\-]+$/.test(searchTerm)) {
        return [] as Product[];
      }
      
      const sanitized = sanitizeSearchTerm(searchTerm);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${sanitized}%,barcode.ilike.${sanitized}%,generic_name.ilike.${sanitized}%`)
        .gt('stock_quantity', 0)
        .order('name')
        .limit(10);
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: searchTerm.length >= 1
  });
}

export function useUpdateStockMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity, movementType, notes }: {
      productId: string;
      quantity: number;
      movementType: 'sale' | 'return' | 'adjustment';
      notes?: string;
    }) => {
      // Update product stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newQuantity = movementType === 'sale' 
        ? product.stock_quantity - quantity 
        : product.stock_quantity + quantity;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      // Record stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          movement_type: movementType,
          quantity: movementType === 'sale' ? -quantity : quantity,
          notes
        });
      
      if (movementError) throw movementError;
      
      return { productId, newQuantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      toast({ title: 'Stock updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating stock', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
}

export function useDisposeProductMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity, reason }: {
      productId: string;
      quantity: number;
      reason: string;
    }) => {
      // Update product stock to 0 or reduce by quantity
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newQuantity = Math.max(0, product.stock_quantity - quantity);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      // Record stock movement as adjustment with disposal reason
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          movement_type: 'adjustment',
          quantity: -quantity,
          notes: `Disposal: ${reason}`
        });
      
      if (movementError) throw movementError;
      
      return { productId, newQuantity, disposedQuantity: quantity };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ 
        title: 'Product disposed successfully',
        description: `${data.disposedQuantity} units marked for disposal`
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error disposing product', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
}