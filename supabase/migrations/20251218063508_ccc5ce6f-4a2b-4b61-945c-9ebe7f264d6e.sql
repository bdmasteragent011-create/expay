-- Add transaction_id column to deposit_requests table
ALTER TABLE public.deposit_requests 
ADD COLUMN transaction_id text;