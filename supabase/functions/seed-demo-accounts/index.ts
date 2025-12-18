import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // ===== ADMIN DEMO ACCOUNT =====
    // Check if admin user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingAdmin = existingUsers?.users?.find(u => u.email === 'admin@demo.com')
    
    let adminUserId: string

    if (existingAdmin) {
      // Update password for existing admin
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        { password: 'admin123', email_confirm: true }
      )
      if (updateError) {
        console.error('Admin password update error:', updateError)
      }
      adminUserId = existingAdmin.id
      results.push('Admin password reset to admin123')
    } else {
      // Create new admin user
      const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
        email: 'admin@demo.com',
        password: 'admin123',
        email_confirm: true
      })

      if (adminAuthError) {
        throw new Error(`Admin auth error: ${adminAuthError.message}`)
      }
      adminUserId = adminAuthData.user.id
      results.push('Admin demo account created')
    }

    // Ensure admin_users entry exists
    await supabase
      .from('admin_users')
      .upsert({ 
        email: 'admin@demo.com', 
        auth_user_id: adminUserId 
      }, { onConflict: 'email' })
    results.push('Admin entry in admin_users table ensured')

    // ===== AGENT DEMO ACCOUNT =====
    const existingAgent = existingUsers?.users?.find(u => u.email === 'agent@demo.com')
    
    let agentUserId: string

    if (existingAgent) {
      // Update password for existing agent
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAgent.id,
        { password: 'demo123', email_confirm: true }
      )
      if (updateError) {
        console.error('Agent password update error:', updateError)
      }
      agentUserId = existingAgent.id
      results.push('Agent password reset to demo123')
    } else {
      // Create new agent user
      const { data: agentAuthData, error: agentAuthError } = await supabase.auth.admin.createUser({
        email: 'agent@demo.com',
        password: 'demo123',
        email_confirm: true
      })

      if (agentAuthError) {
        throw new Error(`Agent auth error: ${agentAuthError.message}`)
      }
      agentUserId = agentAuthData.user.id
      results.push('Agent demo account created')
    }

    // Ensure agents entry exists
    await supabase
      .from('agents')
      .upsert({ 
        email: 'agent@demo.com',
        name: 'Demo Agent',
        agent_id: 'AGENT001',
        activation_code: '77778888',
        auth_user_id: agentUserId,
        phone: '+1234567890',
        district: 'Demo District',
        available_credits: 1000,
        total_pay_in: 0,
        total_pay_out: 0,
        commission_balance: 0,
        max_credit: 5000,
        is_banned: false
      }, { onConflict: 'email' })
    results.push('Agent entry in agents table ensured')

    // ===== ENSURE SETTINGS EXIST =====
    const { data: settingsData } = await supabase.from('settings').select('id').limit(1)
    if (!settingsData || settingsData.length === 0) {
      await supabase.from('settings').insert({
        site_title: 'Agent Panel',
        dollar_rate: 125,
        maintenance_mode: false
      })
      results.push('Default settings created')
    }

    console.log('Seed results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        credentials: {
          admin: { email: 'admin@demo.com', password: 'admin123' },
          agent: { email: 'agent@demo.com', password: 'demo123', code: '77778888' }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Seed error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
