import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserRole } from './useUserRole';

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole | null;
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch profiles with email
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at');
      
      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email || 'N/A',
          full_name: profile.full_name,
          role: (userRole?.role as UserRole) || null,
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      // Use edge function to create user with admin API
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully. They can now sign in immediately.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password reset email sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send password reset email');
    },
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId, newPassword },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update password');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles (this will cascade due to foreign key to auth.users)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}
