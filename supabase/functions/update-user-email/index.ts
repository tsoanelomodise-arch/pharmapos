import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the calling user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin or owner
    const { data: hasPermission } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    const { data: isOwner } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'owner'
    })

    if (!hasPermission && !isOwner) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins and owners can update user emails' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { userId, newEmail } = await req.json()

    if (!userId || !newEmail) {
      return new Response(
        JSON.stringify({ error: 'userId and newEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user email using admin API
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { email: newEmail, email_confirm: true }
    )

    if (updateError) {
      throw updateError
    }

    // Also update email in profiles table
    await supabaseClient
      .from('profiles')
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq('id', userId)

    console.log(`Email updated for user ${userId} to ${newEmail}`)

    return new Response(
      JSON.stringify({ message: 'Email updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
