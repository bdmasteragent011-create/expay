import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get the authorization header to verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract JWT token from Authorization header and decode it
    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to get user ID (payload is base64 encoded)
    let userId: string;
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      userId = payload.sub;
      if (!userId) {
        throw new Error('No user ID in token');
      }
      console.log('Decoded user ID from token:', userId);
    } catch (decodeError) {
      console.log('Failed to decode token:', decodeError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create service client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin using decoded user ID
    const { data: adminCheck } = await serviceClient
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!adminCheck) {
      console.log('Caller is not an admin');
      return new Response(JSON.stringify({ error: 'Forbidden: Not an admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse + normalize request body
    const body = await req.json();

    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').toLowerCase().trim();
    const phone = body?.phone ? String(body.phone).trim() : null;
    const agent_id = String(body?.agent_id ?? '').trim();
    const district = body?.district ? String(body.district).trim() : null;
    const activation_code = String(body?.activation_code ?? '').trim().toUpperCase();
    const password = String(body?.password ?? '');

    console.log('Creating user:', { email, name, agent_id });

    // Check if email already exists in agents (case-insensitive)
    const { data: existingEmail } = await serviceClient
      .from('agents')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if activation code already exists (case-insensitive)
    const { data: existingCode } = await serviceClient
      .from('agents')
      .select('id')
      .ilike('activation_code', activation_code)
      .limit(1)
      .maybeSingle();

    if (existingCode) {
      return new Response(JSON.stringify({ error: 'Activation code already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create auth user using admin API
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.log('Failed to create auth user:', authError);
      return new Response(JSON.stringify({ error: authError?.message || 'Failed to create user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Auth user created:', authData.user.id);

    // Create agent record
    const { data: agentData, error: agentError } = await serviceClient
      .from('agents')
      .insert({
        name,
        email,
        phone: phone || null,
        agent_id,
        district: district || null,
        activation_code,
        auth_user_id: authData.user.id,
        available_credits: 0,
        total_pay_in: 0,
        total_pay_out: 0,
        commission_balance: 0,
        max_credit: 0,
        is_banned: false,
      })
      .select()
      .single();

    if (agentError) {
      console.log('Failed to create agent:', agentError);
      // Try to clean up the auth user
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: 'Failed to create agent record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Agent created successfully:', agentData.id);

    return new Response(JSON.stringify({ success: true, agent: agentData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
