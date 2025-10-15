import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });
}

export function useCanAccessFinancialData() {
  const { data: roles } = useUserRole();
  
  // Only managers, admins, and owners can access cost pricing and supplier data
  return roles && roles.some(role => ['manager', 'admin', 'owner'].includes(role));
}