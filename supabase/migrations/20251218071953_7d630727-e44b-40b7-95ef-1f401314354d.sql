-- Allow agents to update only the is_active field of their own wallets
CREATE POLICY "Agents can update own wallet status"
ON public.wallets
FOR UPDATE
USING (agent_id IN (SELECT id FROM agents WHERE auth_user_id = auth.uid()))
WITH CHECK (agent_id IN (SELECT id FROM agents WHERE auth_user_id = auth.uid()));