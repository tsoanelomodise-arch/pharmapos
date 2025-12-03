import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessSettings {
  id: string;
  pharmacy_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  vat_number: string | null;
  vat_rate: number;
  vat_inclusive: boolean;
  updated_at: string;
  updated_by: string | null;
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as BusinessSettings;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Omit<BusinessSettings, 'id' | 'updated_at'>> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { id, ...updateData } = settings;
      
      const { data, error } = await supabase
        .from('business_settings')
        .update({
          ...updateData,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success("Business settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}
