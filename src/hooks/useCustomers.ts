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
        .from('customers_secure')
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
        .from('customers_secure')
        .select('*')
        .gt('current_balance', 0)
        .order('current_balance', { ascending: false });
      
      if (error) throw error;
      return data as Customer[];
    }
  });
}

// Helper function to sanitize search terms and prevent SQL injection
const sanitizeSearchTerm = (term: string): string => {
  // Escape special ILIKE characters (%, _, \) and limit length
  return term.replace(/[%_\\]/g, '\\$&').trim().slice(0, 100);
};

export function useCustomerSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['customers-search', searchTerm],
    queryFn: async () => {
      // Validate input format before querying
      if (!/^[a-zA-Z0-9\s@.\-+()]+$/.test(searchTerm)) {
        return [] as Customer[];
      }
      
      const sanitized = sanitizeSearchTerm(searchTerm);
      const { data, error } = await supabase
        .from('customers_secure')
        .select('*')
        .or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
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