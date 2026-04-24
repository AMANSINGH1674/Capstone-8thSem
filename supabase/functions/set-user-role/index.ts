// Supabase Edge Function: set-user-role
// Only callable by admins. Uses service role to bypass the role-change trigger.
// Deploy: supabase functions deploy set-user-role

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    // Verify the caller is an admin using their JWT
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // Fetch caller's role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: callerProfile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Forbidden: admin role required' }, 403);
    }

    // Parse request body
    const { target_user_id, new_role } = await req.json();
    if (!target_user_id || !new_role) {
      return json({ error: 'target_user_id and new_role are required' }, 400);
    }

    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(new_role)) {
      return json({ error: `new_role must be one of: ${validRoles.join(', ')}` }, 400);
    }

    // Prevent self-demotion (edge case guard)
    if (target_user_id === user.id && new_role !== 'admin') {
      return json({ error: 'Admins cannot demote themselves' }, 400);
    }

    // Apply role change via service role (bypasses trigger guard)
    const { error: updateErr } = await serviceClient
      .from('profiles')
      .update({ role: new_role })
      .eq('id', target_user_id);

    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ success: true, target_user_id, new_role });
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
