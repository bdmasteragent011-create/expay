import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's auth to verify they own the transaction
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Create admin client for updates
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { transactionId, action } = await req.json();
    console.log(`Processing transaction ${transactionId} with action ${action}`);

    if (!transactionId || !['accept', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's agent record
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agent by auth_user_id
    const { data: agent, error: agentError } = await adminClient
      .from('agents')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (agentError || !agent) {
      console.error('Agent fetch error:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the transaction and verify it belongs to this agent
    const { data: transaction, error: txError } = await adminClient
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('agent_id', agent.id)
      .eq('status', 'pending')
      .single();

    if (txError || !transaction) {
      console.error('Transaction fetch error:', txError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found or already processed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Transaction type: ${transaction.type}, amount: ${transaction.amount}`);

    // Handle rejection - just update status
    if (action === 'reject') {
      const { error: updateError } = await adminClient
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Transaction update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to reject transaction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Transaction rejected successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Transaction rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle acceptance
    if (action === 'accept') {
      let newCredits: number;
      let newTotal: number;
      let updateData: Record<string, number>;

      if (transaction.type === 'pay_in') {
        // Pay-in: Add to available_credits and total_pay_in
        newCredits = (agent.available_credits || 0) + transaction.amount;
        newTotal = (agent.total_pay_in || 0) + transaction.amount;
        updateData = {
          available_credits: newCredits,
          total_pay_in: newTotal
        };
        console.log(`Pay-in: Adding ${transaction.amount} to credits. New balance: ${newCredits}`);
      } else if (transaction.type === 'pay_out') {
        // Pay-out: Check balance first
        if ((agent.available_credits || 0) < transaction.amount) {
          return new Response(
            JSON.stringify({ error: 'Insufficient balance' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Deduct from available_credits and add to total_pay_out
        newCredits = (agent.available_credits || 0) - transaction.amount;
        newTotal = (agent.total_pay_out || 0) + transaction.amount;
        updateData = {
          available_credits: newCredits,
          total_pay_out: newTotal
        };
        console.log(`Pay-out: Deducting ${transaction.amount} from credits. New balance: ${newCredits}`);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid transaction type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update transaction status
      const { error: txUpdateError } = await adminClient
        .from('transactions')
        .update({ status: 'accepted' })
        .eq('id', transactionId);

      if (txUpdateError) {
        console.error('Transaction update error:', txUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to accept transaction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update agent balance
      const { error: agentUpdateError } = await adminClient
        .from('agents')
        .update(updateData)
        .eq('id', agent.id);

      if (agentUpdateError) {
        console.error('Agent update error:', agentUpdateError);
        // Rollback transaction status
        await adminClient
          .from('transactions')
          .update({ status: 'pending' })
          .eq('id', transactionId);
        
        return new Response(
          JSON.stringify({ error: 'Failed to update balance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Transaction accepted successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: transaction.type === 'pay_in' 
            ? `৳${transaction.amount.toLocaleString()} added to your balance`
            : `৳${transaction.amount.toLocaleString()} deducted from your balance`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
