import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'pharmacist' | 'admin' | 'manager' | 'owner' | 'restock';

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return (data?.[0]?.role as UserRole) || null;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useCanAccessFinancialData() {
  const { data: role } = useUserRole();
  
  // All roles can access cost pricing and supplier data
  return role && (['pharmacist', 'manager', 'admin', 'owner', 'restock'] as UserRole[]).includes(role);
}
