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
// Helper function to sanitize search terms and prevent SQL injection
const sanitizeSearchTerm = (term: string): string => {
  // Escape special ILIKE characters (%, _, \) and limit length
  return term.replace(/[%_\\]/g, '\\$&').trim().slice(0, 100);
};

export function useDoctorSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['doctors-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 1) return [];
      
      // Validate input format before querying
      if (!/^[a-zA-Z0-9\s\-]+$/.test(searchTerm)) {
        return [] as Doctor[];
      }
      
      const sanitized = sanitizeSearchTerm(searchTerm);
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .or(`name.ilike.${sanitized}%,license_number.ilike.${sanitized}%,specialization.ilike.${sanitized}%`)
        .order('name')
        .limit(10);
      
      if (error) throw error;
      return data as Doctor[];
    },
    enabled: searchTerm.length >= 1
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
