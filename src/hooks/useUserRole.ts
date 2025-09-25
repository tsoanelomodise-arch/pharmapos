import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data?.role || null;
    },
    enabled: !!user,
  });
}

export function useCanAccessFinancialData() {
  const { data: role } = useUserRole();
  
  // Only managers, admins, and owners can access cost pricing and supplier data
  return role && ['manager', 'admin', 'owner'].includes(role);
}