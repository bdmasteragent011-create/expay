-- Enable realtime for agents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;

-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for deposit_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests;

-- Enable realtime for wallets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;