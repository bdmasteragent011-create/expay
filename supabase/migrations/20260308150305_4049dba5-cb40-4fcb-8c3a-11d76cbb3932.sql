
-- Fix 1: Restrict wallet updates to only is_active column
DROP POLICY IF EXISTS "Agents can update own wallet status" ON public.wallets;
REVOKE UPDATE ON public.wallets FROM authenticated;
GRANT UPDATE (is_active) ON public.wallets TO authenticated;
CREATE POLICY "Agents can update own wallet is_active"
ON public.wallets FOR UPDATE TO authenticated
USING (agent_id IN (SELECT id FROM agents WHERE auth_user_id = auth.uid()))
WITH CHECK (agent_id IN (SELECT id FROM agents WHERE auth_user_id = auth.uid()));

-- Fix 2: Remove agent UPDATE on transactions (should be server-side only)
DROP POLICY IF EXISTS "Agents can update own transactions" ON public.transactions;

-- Fix 3: Restrict deposit request inserts to only 'processing' status
DROP POLICY IF EXISTS "Agents can insert deposit requests" ON public.deposit_requests;
CREATE POLICY "Agents can insert deposit requests"
ON public.deposit_requests FOR INSERT TO authenticated
WITH CHECK (
  agent_id IN (SELECT id FROM agents WHERE auth_user_id = auth.uid())
  AND status = 'processing'::deposit_status
);
