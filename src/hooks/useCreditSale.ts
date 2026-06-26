import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CreditSaleInput {
  saleId: string;
  reason: string;
  items: Array<{ saleItemId: string; quantity: number }>;
}

export function useCreditSaleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreditSaleInput) => {
      const { data, error } = await supabase.functions.invoke('credit-sale', {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; creditNoteId: string; fullyCredited: boolean; refundTotal: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['todays-sales'] });
      qc.invalidateQueries({ queryKey: ['recent-sales'] });
      qc.invalidateQueries({ queryKey: ['all-sales'] });
      qc.invalidateQueries({ queryKey: ['all-sales-details'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['reports-data'] });
      qc.invalidateQueries({ queryKey: ['sale-receipt'] });
      qc.invalidateQueries({ queryKey: ['sale-receipt-credited'] });
      qc.invalidateQueries({ queryKey: ['sale-receipt-credit-notes'] });
      qc.invalidateQueries({ queryKey: ['credit-dialog'] });
      toast({
        title: data.fullyCredited ? 'Transaction fully credited' : 'Partial credit applied',
        description: `Refund: R${data.refundTotal.toFixed(2)}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Credit failed', description: err.message, variant: 'destructive' });
    },
  });
}