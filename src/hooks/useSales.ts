import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Sale {
  id: string;
  customer_id?: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: 'cash' | 'card' | 'credit' | 'insurance';
  payment_status: string;
  prescription_id?: string;
  notes?: string;
  cash_paid?: number;
  change_given?: number;
  created_at: string;
  updated_at: string;
  credit_note_for?: string | null;
  credit_reason?: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export function useTodaysSales() {
  return useQuery({
    queryKey: ['todays-sales'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      if (error) throw error;
      return data as Sale[];
    }
  });
}

export function useRecentSales(limit = 10) {
  return useQuery({
    queryKey: ['recent-sales', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Sale[];
    }
  });
}

export function useAllSales(filters?: {
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['all-sales', filters],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod as 'cash' | 'card' | 'credit' | 'insurance');
      }
      
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Sale[];
    }
  });
}

export interface SaleWithDetails extends Sale {
  customer?: { id: string; name: string; phone?: string } | null;
  items_count: number;
}

export function useAllSalesWithDetails(filters?: {
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['all-sales-details', filters],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customers (id, name, phone),
          sale_items (id)
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod as 'cash' | 'card' | 'credit' | 'insurance');
      }
      
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.searchTerm) {
        query = query.ilike('id', `%${filters.searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to include items_count
      return (data || []).map((sale: any) => ({
        ...sale,
        customer: sale.customers,
        items_count: sale.sale_items?.length || 0,
        customers: undefined,
        sale_items: undefined,
      })) as SaleWithDetails[];
    }
  });
}

export function useCreateSaleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      customerId,
      prescriptionId,
      items, 
      paymentMethod, 
      discountAmount = 0,
      cashPaid,
      changeGiven,
      vatRate = 15,
      vatInclusive = false,
      notes 
    }: {
      customerId?: string;
      prescriptionId?: string;
      items: Array<{ productId: string; quantity: number; unitPrice: number }>;
      paymentMethod: 'cash' | 'card' | 'credit' | 'insurance';
      discountAmount?: number;
      cashPaid?: number;
      changeGiven?: number;
      vatRate?: number;
      vatInclusive?: boolean;
      notes?: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const afterDiscount = subtotal - discountAmount;
      
      // Calculate VAT based on inclusive/exclusive mode
      const taxAmount = vatInclusive 
        ? afterDiscount - (afterDiscount / (1 + vatRate / 100)) // Extract VAT from inclusive price
        : afterDiscount * (vatRate / 100); // Add VAT to exclusive price
      
      const totalAmount = vatInclusive ? afterDiscount : afterDiscount + taxAmount;
      
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId,
          prescription_id: prescriptionId,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          payment_method: paymentMethod,
          cash_paid: cashPaid,
          change_given: changeGiven,
          notes,
          processed_by: user.id,
        })
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      
      // Update stock quantities
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.productId);
          
          // Record stock movement
          await supabase
            .from('stock_movements')
            .insert({
              product_id: item.productId,
              movement_type: 'sale',
              quantity: -item.quantity,
              reference_id: sale.id,
              notes: `Sale #${sale.id}`
            });
        }
      }
      
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays-sales'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sale completed successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error processing sale', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
}

export function useUpdateSaleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      saleId,
      paymentMethod,
      paymentStatus,
      discountAmount,
      notes,
      customerId,
    }: {
      saleId: string;
      paymentMethod?: 'cash' | 'card' | 'credit' | 'insurance';
      paymentStatus?: string;
      discountAmount?: number;
      notes?: string;
      customerId?: string | null;
    }) => {
      const updateData: Record<string, any> = {};
      
      if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
      if (paymentStatus !== undefined) updateData.payment_status = paymentStatus;
      if (discountAmount !== undefined) updateData.discount_amount = discountAmount;
      if (notes !== undefined) updateData.notes = notes;
      if (customerId !== undefined) updateData.customer_id = customerId;
      
      const { data, error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays-sales'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-sales-details'] });
      toast({ title: 'Transaction updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating transaction', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
}

export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      // Fetch sale items to restore stock
      const { data: items, error: itemsFetchError } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', saleId);

      if (itemsFetchError) throw itemsFetchError;

      // Restore stock for each item
      for (const item of items || []) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity + item.quantity })
            .eq('id', item.product_id);

          await supabase
            .from('stock_movements')
            .insert({
              product_id: item.product_id,
              movement_type: 'adjustment',
              quantity: item.quantity,
              reference_id: saleId,
              notes: `Reversal: deleted sale #${saleId.slice(-8).toUpperCase()}`,
            });
        }
      }

      // Delete sale items
      const { error: deleteItemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);
      if (deleteItemsError) throw deleteItemsError;

      // Delete sale
      const { error: deleteSaleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);
      if (deleteSaleError) throw deleteSaleError;

      return saleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays-sales'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-sales-details'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Transaction deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}