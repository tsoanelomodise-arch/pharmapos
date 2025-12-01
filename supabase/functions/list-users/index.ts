import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode JWT to get user ID
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const currentUserId = payload.sub;

    if (!currentUserId) {
      return new Response(
        JSON.stringify({ error: "Invalid token - no user ID" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("List users requested by:", currentUserId);

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if current user has admin or owner role
    const { data: userRoleData, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)
      .single();

    if (roleCheckError || !userRoleData) {
      console.log("Role check error:", roleCheckError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Unable to verify role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["admin", "owner", "manager"];
    if (!allowedRoles.includes(userRoleData.role)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User has role:", userRoleData.role);

    // Fetch all users from auth.users using admin API
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error listing auth users:", authError.message);
      return new Response(
        JSON.stringify({ error: "Failed to list users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found", authUsers.users.length, "auth users");

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, created_at");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError.message);
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError.message);
    }

    // Combine data - use auth.users as the source of truth
    const users = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.id === authUser.id);
      const userRole = roles?.find((r) => r.user_id === authUser.id);

      return {
        id: authUser.id,
        email: authUser.email || "N/A",
        full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
        role: userRole?.role || null,
        created_at: authUser.created_at,
      };
    });

    console.log("Returning", users.length, "users");

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
