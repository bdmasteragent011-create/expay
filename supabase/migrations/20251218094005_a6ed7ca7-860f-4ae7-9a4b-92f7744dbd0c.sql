-- Enable realtime for settings and deposit_methods tables (others already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_methods;