
-- Fix 1: Add explicit deny-public policies for agents table
-- The existing RLS policies only allow authenticated agents/admins, but adding explicit anon denial for defense-in-depth
CREATE POLICY "deny_anon_access" ON public.agents FOR SELECT TO anon USING (false);

-- Fix 2: Add explicit deny-public policies for wallets table
CREATE POLICY "deny_anon_access" ON public.wallets FOR SELECT TO anon USING (false);
