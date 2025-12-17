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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await anonClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminCheck } = await serviceClient
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', callerUser.id)
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden: Not an admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, email, password, admin_id } = await req.json();

    if (action === 'create') {
      // Check if email already exists in admin_users
      const { data: existingAdmin } = await serviceClient
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingAdmin) {
        return new Response(JSON.stringify({ error: 'Admin with this email already exists' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create auth user
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

      // Create admin_users record
      const { data: adminData, error: adminError } = await serviceClient
        .from('admin_users')
        .insert({
          email,
          auth_user_id: authData.user.id,
        })
        .select()
        .single();

      if (adminError) {
        console.log('Failed to create admin record:', adminError);
        await serviceClient.auth.admin.deleteUser(authData.user.id);
        return new Response(JSON.stringify({ error: 'Failed to create admin record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, admin: adminData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'delete') {
      // Get the admin to delete
      const { data: adminToDelete } = await serviceClient
        .from('admin_users')
        .select('*')
        .eq('id', admin_id)
        .maybeSingle();

      if (!adminToDelete) {
        return new Response(JSON.stringify({ error: 'Admin not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Don't allow deleting yourself
      if (adminToDelete.auth_user_id === callerUser.id) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own admin account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete from admin_users
      const { error: deleteError } = await serviceClient
        .from('admin_users')
        .delete()
        .eq('id', admin_id);

      if (deleteError) {
        return new Response(JSON.stringify({ error: 'Failed to delete admin' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Optionally delete auth user
      if (adminToDelete.auth_user_id) {
        await serviceClient.auth.admin.deleteUser(adminToDelete.auth_user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'list') {
      const { data: admins, error: listError } = await serviceClient
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) {
        return new Response(JSON.stringify({ error: 'Failed to list admins' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ admins }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
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
