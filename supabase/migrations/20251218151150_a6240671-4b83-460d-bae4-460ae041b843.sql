-- Allow agents to delete their own accepted/rejected transactions (history)
CREATE POLICY "Agents can delete own history transactions"
ON public.transactions
FOR DELETE
USING (
  is_user_visible = true 
  AND status IN ('accepted', 'rejected')
  AND agent_id IN (
    SELECT agents.id FROM agents WHERE agents.auth_user_id = auth.uid()
  )
);