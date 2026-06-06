import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Starting create-user function");

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) {
      console.log("No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase admin client (service role) for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller's JWT cryptographically via Supabase auth helper
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callingUser) {
      console.log("Auth verification failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentUserId = callingUser.id;
    console.log("Verified user ID:", currentUserId);

    // Check if the current user has admin or owner role using admin client
    const { data: userRoleData, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)
      .single();

    console.log("Role check result:", userRoleData, roleCheckError?.message);

    const userRole = userRoleData?.role;
    const isAdminOrOwner = userRole === "admin" || userRole === "owner";

    console.log("User role:", userRole, "Is admin/owner:", isAdminOrOwner);

    if (!isAdminOrOwner) {
      console.log("User does not have admin or owner role");
      return new Response(
        JSON.stringify({ error: "Only admins and owners can create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const { email, password, full_name, role } = await req.json();
    console.log("Creating user with email:", email, "role:", role);

    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, full_name, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce role-ceiling: admins cannot create owners/admins; only owners can.
    const ALLOWED_ROLES_FOR_ADMIN = ["pharmacist", "manager"];
    const ALLOWED_ROLES_FOR_OWNER = ["pharmacist", "manager", "admin", "owner"];
    const permittedRoles =
      userRole === "owner" ? ALLOWED_ROLES_FOR_OWNER : ALLOWED_ROLES_FOR_ADMIN;

    if (!permittedRoles.includes(role)) {
      console.log("Role assignment denied:", { userRole, requestedRole: role });
      return new Response(
        JSON.stringify({ error: "You cannot assign a role at or above your own" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user using the admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.log("Error creating user:", createError.message);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", newUser.user.id);

    // Wait for the trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the role if it's not the default pharmacist role
    if (role !== "pharmacist") {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUser.user.id);

      if (roleError) {
        console.error("Error updating role:", roleError);
      } else {
        console.log("Role updated to:", role);
      }
    }

    return new Response(
      JSON.stringify({ user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
