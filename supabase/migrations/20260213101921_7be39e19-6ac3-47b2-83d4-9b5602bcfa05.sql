
-- Fix: Restrict deposit methods to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active deposit methods" ON public.deposit_methods;

CREATE POLICY "Authenticated users can view active deposit methods" 
ON public.deposit_methods FOR SELECT 
TO authenticated
USING (is_active = true);
