-- Add transaction_id for pay-in requests and method_name/method_number for pay-out requests
ALTER TABLE public.transactions 
ADD COLUMN transaction_id TEXT,
ADD COLUMN method_name TEXT,
ADD COLUMN method_number TEXT;