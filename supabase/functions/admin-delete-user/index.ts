import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminCheck } = await adminClient
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!adminCheck) {
      console.error('Not an admin');
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agentId } = await req.json();
    console.log(`Admin ${user.id} deleting agent ${agentId}`);

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agent's auth_user_id
    const { data: agent, error: agentError } = await adminClient
      .from('agents')
      .select('auth_user_id, name')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting agent: ${agent.name}`);

    // Set is_deleted = true to trigger realtime logout and block future logins
    const { error: updateError } = await adminClient
      .from('agents')
      .update({ is_deleted: true })
      .eq('id', agentId);

    if (updateError) {
      console.error('Error marking agent as deleted:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Marked agent as deleted (triggers realtime logout)');

    // Delete related records
    await adminClient.from('wallets').delete().eq('agent_id', agentId);
    console.log('Deleted wallets');

    await adminClient.from('messages').delete().eq('agent_id', agentId);
    console.log('Deleted messages');

    await adminClient.from('transactions').delete().eq('agent_id', agentId);
    console.log('Deleted transactions');

    await adminClient.from('deposit_requests').delete().eq('agent_id', agentId);
    console.log('Deleted deposit requests');

    // Note: We keep the agent record (with is_deleted=true) and auth user
    // so users see "Your account has been deleted" message when trying to login

    console.log('User deletion completed successfully');
    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});