-- Add icon URLs to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS telegram_icon_url TEXT,
ADD COLUMN IF NOT EXISTS live_chat_icon_url TEXT;

-- Add image URL to deposit_methods table for payment gateway logos
ALTER TABLE public.deposit_methods
ADD COLUMN IF NOT EXISTS image_url TEXT;