import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  insurance_info?: any;
  credit_limit: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    }
  });
}

export function useCustomersWithDebt() {
  return useQuery({
    queryKey: ['customers-with-debt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .gt('current_balance', 0)
        .order('current_balance', { ascending: false });
      
      if (error) throw error;
      return data as Customer[];
    }
  });
}

export function useCustomerSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['customers-search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: searchTerm.length > 2
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-debt'] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete patient: " + error.message,
        variant: "destructive",
      });
    },
  });
}