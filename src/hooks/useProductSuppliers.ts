import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  cost_price: number;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
  product?: {
    id: string;
    name: string;
    unit_price: number;
    stock_quantity: number;
  };
}

// Get all suppliers for a specific product
export function useProductSuppliers(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_suppliers')
        .select(`
          *,
          supplier:suppliers(id, name, contact_person, phone, email)
        `)
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as ProductSupplier[];
    },
    enabled: !!productId,
  });
}

// Get all products for a specific supplier
export function useSupplierProducts(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('product_suppliers')
        .select(`
          *,
          product:products(id, name, unit_price, stock_quantity)
        `)
        .eq('supplier_id', supplierId)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as ProductSupplier[];
    },
    enabled: !!supplierId,
  });
}

// Get product count per supplier
export function useSupplierProductCounts() {
  return useQuery({
    queryKey: ['supplier-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_suppliers')
        .select('supplier_id');
      
      if (error) throw error;
      
      // Count products per supplier
      const counts: Record<string, number> = {};
      data.forEach((item) => {
        counts[item.supplier_id] = (counts[item.supplier_id] || 0) + 1;
      });
      
      return counts;
    },
  });
}

// Get all product-supplier mappings with full data
export function useAllProductSuppliers() {
  return useQuery({
    queryKey: ['all-product-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_suppliers')
        .select(`
          *,
          supplier:suppliers(id, name),
          product:products(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProductSupplier[];
    },
  });
}

// Add a product-supplier relationship
export function useAddProductSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      supplier_id: string;
      cost_price?: number;
      is_primary?: boolean;
      notes?: string;
    }) => {
      // If setting as primary, first unset any existing primary
      if (data.is_primary) {
        await supabase
          .from('product_suppliers')
          .update({ is_primary: false })
          .eq('product_id', data.product_id);
      }

      const { data: result, error } = await supabase
        .from('product_suppliers')
        .insert({
          product_id: data.product_id,
          supplier_id: data.supplier_id,
          cost_price: data.cost_price || 0,
          is_primary: data.is_primary || false,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products', variables.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-product-counts'] });
      queryClient.invalidateQueries({ queryKey: ['all-product-suppliers'] });
      toast.success('Supplier linked to product');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('This supplier is already linked to this product');
      } else {
        toast.error(`Failed to link supplier: ${error.message}`);
      }
    },
  });
}

// Remove a product-supplier relationship
export function useRemoveProductSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId, supplierId }: { id: string; productId: string; supplierId: string }) => {
      const { error } = await supabase
        .from('product_suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { productId, supplierId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products', data.supplierId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-product-counts'] });
      queryClient.invalidateQueries({ queryKey: ['all-product-suppliers'] });
      toast.success('Supplier unlinked from product');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unlink supplier: ${error.message}`);
    },
  });
}

// Update a product-supplier relationship
export function useUpdateProductSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId, ...updates }: {
      id: string;
      productId: string;
      cost_price?: number;
      is_primary?: boolean;
      notes?: string;
    }) => {
      // If setting as primary, first unset any existing primary
      if (updates.is_primary) {
        await supabase
          .from('product_suppliers')
          .update({ is_primary: false })
          .eq('product_id', productId)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('product_suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products', data.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['all-product-suppliers'] });
      toast.success('Supplier relationship updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// Set primary supplier for a product
export function useSetPrimarySupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      // First unset all primary flags for this product
      await supabase
        .from('product_suppliers')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Then set the new primary
      const { data, error } = await supabase
        .from('product_suppliers')
        .update({ is_primary: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['all-product-suppliers'] });
      toast.success('Primary supplier updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set primary supplier: ${error.message}`);
    },
  });
}

// Bulk update suppliers for a product
export function useBulkUpdateProductSuppliers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, supplierIds, primarySupplierId }: {
      productId: string;
      supplierIds: string[];
      primarySupplierId?: string;
    }) => {
      // Get existing suppliers for this product
      const { data: existing, error: fetchError } = await supabase
        .from('product_suppliers')
        .select('supplier_id')
        .eq('product_id', productId);

      if (fetchError) throw fetchError;

      const existingIds = new Set(existing?.map(e => e.supplier_id) || []);
      const newIds = new Set(supplierIds);

      // Find suppliers to add and remove
      const toAdd = supplierIds.filter(id => !existingIds.has(id));
      const toRemove = [...existingIds].filter(id => !newIds.has(id));

      // Remove old suppliers
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('product_suppliers')
          .delete()
          .eq('product_id', productId)
          .in('supplier_id', toRemove);
        if (error) throw error;
      }

      // Add new suppliers
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('product_suppliers')
          .insert(toAdd.map(supplierId => ({
            product_id: productId,
            supplier_id: supplierId,
            is_primary: supplierId === primarySupplierId,
          })));
        if (error) throw error;
      }

      // Update primary supplier if specified
      if (primarySupplierId && supplierIds.includes(primarySupplierId)) {
        // Unset all primary
        await supabase
          .from('product_suppliers')
          .update({ is_primary: false })
          .eq('product_id', productId);

        // Set new primary
        await supabase
          .from('product_suppliers')
          .update({ is_primary: true })
          .eq('product_id', productId)
          .eq('supplier_id', primarySupplierId);
      }

      return { productId, supplierIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-product-counts'] });
      queryClient.invalidateQueries({ queryKey: ['all-product-suppliers'] });
      toast.success('Product suppliers updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update suppliers: ${error.message}`);
    },
  });
}
