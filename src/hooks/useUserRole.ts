import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'pharmacist' | 'admin' | 'manager' | 'owner';

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
      
      // Return the first role if multiple exist, or null if none
      return (data?.[0]?.role as UserRole) || null;
    },
    enabled: !!user,
  });
}

export function useCanAccessFinancialData() {
  const { data: role } = useUserRole();
  
  // Only managers, admins, and owners can access cost pricing and supplier data
  return role && (['manager', 'admin', 'owner'] as UserRole[]).includes(role);
}
