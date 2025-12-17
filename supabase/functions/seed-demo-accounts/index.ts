import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function seeds demo accounts - should only be called once

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const results: string[] = []

    // Create admin demo user
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@demo.com',
      password: 'admin123',
      email_confirm: true
    })

    if (adminAuthError && !adminAuthError.message.includes('already been registered')) {
      throw new Error(`Admin auth error: ${adminAuthError.message}`)
    }

    if (adminAuthData?.user) {
      // Add to admin_users table
      const { error: adminInsertError } = await supabase
        .from('admin_users')
        .upsert({ 
          email: 'admin@demo.com', 
          auth_user_id: adminAuthData.user.id 
        }, { onConflict: 'email' })

      if (adminInsertError) {
        results.push(`Admin user created but table insert failed: ${adminInsertError.message}`)
      } else {
        results.push('Admin demo account created successfully')
      }
    } else {
      // User already exists, try to get their ID and ensure admin_users entry exists
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      const adminUser = existingUser?.users?.find(u => u.email === 'admin@demo.com')
      
      if (adminUser) {
        await supabase
          .from('admin_users')
          .upsert({ email: 'admin@demo.com', auth_user_id: adminUser.id }, { onConflict: 'email' })
        results.push('Admin demo account already exists, ensured admin_users entry')
      }
    }

    // Create agent demo user
    const { data: agentAuthData, error: agentAuthError } = await supabase.auth.admin.createUser({
      email: 'agent@demo.com',
      password: 'demo123',
      email_confirm: true
    })

    if (agentAuthError && !agentAuthError.message.includes('already been registered')) {
      throw new Error(`Agent auth error: ${agentAuthError.message}`)
    }

    if (agentAuthData?.user) {
      // Add to agents table
      const { error: agentInsertError } = await supabase
        .from('agents')
        .upsert({ 
          email: 'agent@demo.com',
          name: 'Demo Agent',
          agent_id: 'AGENT001',
          activation_code: 'DEMO001',
          auth_user_id: agentAuthData.user.id,
          phone: '+1234567890',
          district: 'Demo District',
          available_credits: 1000,
          max_credit: 5000
        }, { onConflict: 'email' })

      if (agentInsertError) {
        results.push(`Agent user created but table insert failed: ${agentInsertError.message}`)
      } else {
        results.push('Agent demo account created successfully')
      }
    } else {
      // User already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const agentUser = existingUsers?.users?.find(u => u.email === 'agent@demo.com')
      
      if (agentUser) {
        await supabase
          .from('agents')
          .upsert({ 
            email: 'agent@demo.com',
            name: 'Demo Agent',
            agent_id: 'AGENT001',
            activation_code: 'DEMO001',
            auth_user_id: agentUser.id,
            phone: '+1234567890',
            district: 'Demo District'
          }, { onConflict: 'email' })
        results.push('Agent demo account already exists, ensured agents entry')
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})