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

    // Delete related records first (cascade should handle most, but let's be explicit)
    // Delete wallets
    await adminClient.from('wallets').delete().eq('agent_id', agentId);
    console.log('Deleted wallets');

    // Delete messages
    await adminClient.from('messages').delete().eq('agent_id', agentId);
    console.log('Deleted messages');

    // Delete transactions
    await adminClient.from('transactions').delete().eq('agent_id', agentId);
    console.log('Deleted transactions');

    // Delete deposit requests
    await adminClient.from('deposit_requests').delete().eq('agent_id', agentId);
    console.log('Deleted deposit requests');

    // Delete agent record
    const { error: deleteAgentError } = await adminClient
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (deleteAgentError) {
      console.error('Error deleting agent:', deleteAgentError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete agent' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Deleted agent record');

    // Delete auth user if exists
    if (agent.auth_user_id) {
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(agent.auth_user_id);
      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        // Don't fail the whole operation, agent is already deleted
      } else {
        console.log('Deleted auth user');
      }
    }

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