import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export type AppModule = 
  | 'dashboard'
  | 'dispensing'
  | 'pos'
  | 'debtors'
  | 'stock'
  | 'reports'
  | 'management'
  | 'patients'
  | 'doctors'
  | 'help';

export interface ModulePermission {
  id: string;
  user_id: string;
  module: AppModule;
  created_at: string;
}

export function useUserModules() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-modules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_user_modules', { _user_id: user.id });

      if (error) throw error;
      
      return data.map((item: { module: AppModule }) => item.module);
    },
    enabled: !!user?.id
  });
}

export function useAllUserPermissions() {
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      const { data: permissions, error: permissionsError } = await supabase
        .from('user_module_permissions')
        .select('*');
      
      if (permissionsError) throw permissionsError;

      return profiles.map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unknown',
        role: roles.find(r => r.user_id === profile.id)?.role || 'pharmacist',
        permissions: permissions
          .filter(p => p.user_id === profile.id)
          .map(p => p.module)
      }));
    }
  });

  return { data: users, isLoading: !users };
}

export function useUpdateModulePermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      modules 
    }: { 
      userId: string; 
      modules: AppModule[] 
    }) => {
      // First, delete all existing permissions for this user
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert the new permissions
      if (modules.length > 0) {
        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(
            modules.map(module => ({
              user_id: userId,
              module
            }))
          );

        if (insertError) throw insertError;
      }

      return { userId, modules };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-modules'] });
      toast({
        title: 'Permissions Updated',
        description: 'Module permissions have been updated successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update permissions: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
}