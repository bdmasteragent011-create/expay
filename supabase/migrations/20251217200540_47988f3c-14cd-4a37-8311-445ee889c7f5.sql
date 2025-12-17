-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a security definer function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE auth_user_id = _user_id
  )
$$;

-- Create new non-recursive policy for admin_users
CREATE POLICY "Admins can view admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Update agents policies to use the new function
DROP POLICY IF EXISTS "Admins can view all agents" ON public.agents;
DROP POLICY IF EXISTS "Admins can insert agents" ON public.agents;
DROP POLICY IF EXISTS "Admins can update agents" ON public.agents;
DROP POLICY IF EXISTS "Admins can delete agents" ON public.agents;

CREATE POLICY "Admins can view all agents"
ON public.agents FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert agents"
ON public.agents FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update agents"
ON public.agents FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete agents"
ON public.agents FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- Update other tables to use is_admin function
DROP POLICY IF EXISTS "Admins can manage deposit methods" ON public.deposit_methods;
CREATE POLICY "Admins can manage deposit methods"
ON public.deposit_methods FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage deposit requests" ON public.deposit_requests;
CREATE POLICY "Admins can manage deposit requests"
ON public.deposit_requests FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage messages" ON public.messages;
CREATE POLICY "Admins can manage messages"
ON public.messages FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions"
ON public.transactions FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage wallets" ON public.wallets;
CREATE POLICY "Admins can manage wallets"
ON public.wallets FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));