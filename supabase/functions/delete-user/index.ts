import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode JWT to get user ID (JWT is already verified by Supabase infrastructure)
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const callingUserId = payload.sub;
    
    if (!callingUserId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token - no user ID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Delete user requested by:', callingUserId);

    // Check if caller has admin or owner role
    const { data: hasPermission } = await supabaseClient.rpc('has_role', {
      _user_id: callingUserId,
      _role: 'owner'
    });

    if (!hasPermission) {
      console.error('User does not have permission to delete users');
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only owners can delete users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (userId === callingUserId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting user ${userId} requested by ${callingUserId}`);

    // Step 1: Clear foreign key references in sales table
    const { error: salesError } = await supabaseClient
      .from('sales')
      .update({ processed_by: null })
      .eq('processed_by', userId);

    if (salesError) {
      console.error('Error clearing sales references:', salesError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear sales references' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Clear foreign key references in prescriptions table (dispensed_by)
    const { error: prescriptionsError } = await supabaseClient
      .from('prescriptions')
      .update({ dispensed_by: null })
      .eq('dispensed_by', userId);

    if (prescriptionsError) {
      console.error('Error clearing prescriptions references:', prescriptionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear prescription references' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Delete user module permissions
    const { error: permissionsError } = await supabaseClient
      .from('user_module_permissions')
      .delete()
      .eq('user_id', userId);

    if (permissionsError) {
      console.error('Error deleting module permissions:', permissionsError);
    }

    // Step 4: Delete user roles
    const { error: rolesError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
    }

    // Step 5: Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Step 6: Delete the auth user using admin API
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from auth system' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
