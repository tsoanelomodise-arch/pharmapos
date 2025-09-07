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
        .order('created_at');
      
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