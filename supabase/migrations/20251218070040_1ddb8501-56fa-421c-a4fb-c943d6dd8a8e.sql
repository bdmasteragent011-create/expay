-- Add wallet_name column to wallets table for wallet identification
ALTER TABLE public.wallets 
ADD COLUMN wallet_name text;