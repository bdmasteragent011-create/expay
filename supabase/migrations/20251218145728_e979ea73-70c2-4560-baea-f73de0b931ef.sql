-- Add visibility flag so admin balance adjustments never appear on agent Pay In/Pay Out pages
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_user_visible boolean NOT NULL DEFAULT true;

-- Hide any already-existing accepted records (these were created by admin balance +/- before this change)
UPDATE public.transactions
SET is_user_visible = false
WHERE status = 'accepted' AND created_at < now();

-- Tighten agent read access so agents can only see user-visible (request) transactions
DROP POLICY IF EXISTS "Agents can view own transactions" ON public.transactions;
CREATE POLICY "Agents can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  is_user_visible = true
  AND agent_id IN (
    SELECT agents.id
    FROM public.agents
    WHERE agents.auth_user_id = auth.uid()
  )
);

-- Tighten agent update access (optional, but keeps hidden rows fully admin-only)
DROP POLICY IF EXISTS "Agents can update own transactions" ON public.transactions;
CREATE POLICY "Agents can update own transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (
  is_user_visible = true
  AND agent_id IN (
    SELECT agents.id
    FROM public.agents
    WHERE agents.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  is_user_visible = true
  AND agent_id IN (
    SELECT agents.id
    FROM public.agents
    WHERE agents.auth_user_id = auth.uid()
  )
);
