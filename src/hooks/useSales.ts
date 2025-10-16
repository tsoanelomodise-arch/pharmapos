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

export function useCreateSaleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      customerId, 
      items, 
      paymentMethod, 
      discountAmount = 0,
      cashPaid,
      changeGiven,
      notes 
    }: {
      customerId?: string;
      items: Array<{ productId: string; quantity: number; unitPrice: number }>;
      paymentMethod: 'cash' | 'card' | 'credit' | 'insurance';
      discountAmount?: number;
      cashPaid?: number;
      changeGiven?: number;
      notes?: string;
    }) => {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = (subtotal - discountAmount) * 0.15;
      const totalAmount = subtotal - discountAmount + taxAmount;
      
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          payment_method: paymentMethod,
          cash_paid: cashPaid,
          change_given: changeGiven,
          notes
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