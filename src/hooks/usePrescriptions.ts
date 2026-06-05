import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Prescription {
  id: string;
  customer_id: string;
  doctor_name: string;
  doctor_license?: string;
  prescription_date: string;
  medications: any;
  status: string;
  dispensed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function usePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          customers (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function usePendingPrescriptions() {
  return useQuery({
    queryKey: ['pending-prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          customers (
            name,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('prescription_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function useTodaysPrescriptions() {
  return useQuery({
    queryKey: ['todays-prescriptions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      if (error) throw error;
      return data as Prescription[];
    }
  });
}

export function useRecentPatients() {
  return useQuery({
    queryKey: ['recent-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers_secure')
        .select(`
          *,
          prescriptions!inner(id, created_at)
        `)
        .order('prescriptions.created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });
}

export function useProcessPrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prescriptionId: string) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      // First, fetch the prescription with all details
      const { data: prescription, error: fetchError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', prescriptionId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!prescription) throw new Error('Prescription not found');

      // Parse medications from prescription
      const medications = prescription.medications as Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
      }>;

      if (!medications || medications.length === 0) {
        throw new Error('No medications found in prescription');
      }

      // Only medications linked to an actual product can become sale items
      const billable = medications.filter(
        (m) => m && typeof m.product_id === 'string' && m.product_id.length > 0
      );

      if (billable.length === 0) {
        throw new Error(
          'This prescription has no medications linked to inventory products. Edit it and select medications from stock before dispensing.'
        );
      }

      // Verify all referenced products still exist
      const productIds = Array.from(new Set(billable.map((m) => m.product_id)));
      const { data: existingProducts, error: productsError } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .in('id', productIds);

      if (productsError) throw productsError;

      const productMap = new Map(
        (existingProducts ?? []).map((p) => [p.id, p])
      );
      const missing = productIds.filter((id) => !productMap.has(id));
      if (missing.length > 0) {
        throw new Error(
          'One or more prescribed products no longer exist in inventory. Edit the prescription and reselect the medications.'
        );
      }

      // Calculate totals
      const subtotal = billable.reduce((sum, med) => sum + (med.quantity * med.unit_price), 0);
      const taxAmount = subtotal * 0.15;
      const totalAmount = subtotal + taxAmount;

      // Create sale transaction
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: prescription.customer_id,
          prescription_id: prescriptionId,
          total_amount: totalAmount,
          discount_amount: 0,
          tax_amount: taxAmount,
          payment_method: 'card', // Default to card for prescription sales
          payment_status: 'completed',
          notes: `Prescription dispensed - Dr. ${prescription.doctor_name}`,
          processed_by: user.id,
        })
        .select()
        .single();
      
      if (saleError) throw saleError;

      // Create sale items from medications
      const saleItems = billable.map(med => ({
        sale_id: sale.id,
        product_id: med.product_id,
        quantity: med.quantity,
        unit_price: med.unit_price,
        total_price: med.quantity * med.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;

      // Update stock quantities and create stock movements
      for (const med of billable) {
        const product = productMap.get(med.product_id);
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - med.quantity })
            .eq('id', med.product_id);
          
          await supabase
            .from('stock_movements')
            .insert({
              product_id: med.product_id,
              movement_type: 'sale',
              quantity: -med.quantity,
              reference_id: sale.id,
              notes: `Prescription sale #${sale.id}`
            });
        }
      }

      // Finally, update prescription status
      const { data, error } = await supabase
        .from('prescriptions')
        .update({ 
          status: 'dispensed',
          dispensed_at: new Date().toISOString(),
          dispensed_by: user.id,
        })
        .eq('id', prescriptionId)
        .select()
        .single();
      
      if (error) throw error;
      return { prescription: data, sale };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['todays-sales'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Prescription Processed",
        description: "Prescription dispensed and sale transaction created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process prescription. Please try again.",
        variant: "destructive",
      });
    }
  });
}

export function useDeletePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prescriptionId: string) => {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);
      if (error) throw error;
      return prescriptionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
      toast({
        title: "Prescription Deleted",
        description: "The prescription has been removed from the queue.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete prescription.",
        variant: "destructive",
      });
    },
  });
}