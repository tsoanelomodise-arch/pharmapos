import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'pharmacist' | 'admin' | 'manager' | 'owner';

export function useUserRole() {
  const { user } = useAuth();
  
  const query = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('useUserRole: No user found');
        return null;
      }
      
      console.log('useUserRole: Fetching role for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('useUserRole: Error fetching role:', error);
        throw error;
      }
      
      const role = (data?.[0]?.role as UserRole) || null;
      console.log('useUserRole: Fetched role:', role, 'from data:', data);
      
      return role;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
  
  console.log('useUserRole: Current role state:', query.data, 'isLoading:', query.isLoading);
  
  return query;
}

export function useCanAccessFinancialData() {
  const { data: role } = useUserRole();
  
  // Only managers, admins, and owners can access cost pricing and supplier data
  return role && (['manager', 'admin', 'owner'] as UserRole[]).includes(role);
}
