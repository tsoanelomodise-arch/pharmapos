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

    // Extract and decode the JWT to get user ID
    // The JWT is already verified by Supabase edge function infrastructure
    const token = authHeader.replace("Bearer ", "");
    
    // Decode JWT payload (middle part)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("Invalid JWT format");
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Decode the payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const currentUserId = payload.sub;
    
    if (!currentUserId) {
      console.log("No user ID in token");
      return new Response(
        JSON.stringify({ error: "Invalid token - no user ID" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Current user ID from JWT:", currentUserId);

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
