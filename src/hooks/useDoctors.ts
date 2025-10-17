import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Doctor {
  id: string;
  name: string;
  license_number?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Doctor[];
    }
  });
}

export function useDoctorSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['doctors-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,license_number.ilike.%${searchTerm}%,specialization.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);
      
      if (error) throw error;
      return data as Doctor[];
    },
    enabled: searchTerm.length >= 2
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (doctor: Omit<Doctor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('doctors')
        .insert(doctor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast({
        title: "Success",
        description: "Doctor added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Doctor> & { id: string }) => {
      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast({
        title: "Success",
        description: "Doctor updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast({
        title: "Success",
        description: "Doctor deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
