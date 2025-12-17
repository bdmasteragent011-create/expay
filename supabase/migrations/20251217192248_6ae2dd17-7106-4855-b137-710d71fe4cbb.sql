-- Create enum types
CREATE TYPE public.transaction_type AS ENUM ('pay_in', 'pay_out');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.deposit_status AS ENUM ('processing', 'approved', 'rejected');
CREATE TYPE public.user_role AS ENUM ('admin', 'agent');

-- Create agents table (user profiles)
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  agent_id TEXT NOT NULL UNIQUE,
  district TEXT,
  activation_code TEXT NOT NULL UNIQUE,
  available_credits DECIMAL(15,2) DEFAULT 0,
  total_pay_in DECIMAL(15,2) DEFAULT 0,
  total_pay_out DECIMAL(15,2) DEFAULT 0,
  commission_balance DECIMAL(15,2) DEFAULT 0,
  max_credit DECIMAL(15,2) DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  wallet_number TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table (pay in/out requests)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status transaction_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table (admin to user)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposit_methods table
CREATE TABLE public.deposit_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  number TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposit_requests table
CREATE TABLE public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  method_id UUID REFERENCES public.deposit_methods(id),
  amount_usdt DECIMAL(15,2) NOT NULL,
  amount_bdt DECIMAL(15,2) NOT NULL,
  status deposit_status DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT DEFAULT 'Agent Panel',
  telegram_link TEXT,
  live_chat_link TEXT,
  dollar_rate DECIMAL(10,2) DEFAULT 125,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (site_title, dollar_rate) VALUES ('Agent Panel', 125);

-- Insert default deposit methods
INSERT INTO public.deposit_methods (name, number, instructions, is_active) VALUES 
  ('Bkash', '01XXXXXXXXX', 'Send money to this Bkash number', true),
  ('Nagad', '01XXXXXXXXX', 'Send money to this Nagad number', true),
  ('Rocket', '01XXXXXXXXX', 'Send money to this Rocket number', true),
  ('Upay', '01XXXXXXXXX', 'Send money to this Upay number', true),
  ('Bank', 'Account: XXXXXXX', 'Transfer to this bank account', true),
  ('USDT', 'TRC20: TXXXXXXX', 'Send USDT to this TRC20 address', true);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents
CREATE POLICY "Agents can view own profile" ON public.agents FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Admins can view all agents" ON public.agents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can insert agents" ON public.agents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can update agents" ON public.agents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can delete agents" ON public.agents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for wallets
CREATE POLICY "Agents can view own wallets" ON public.wallets FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can manage wallets" ON public.wallets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for transactions
CREATE POLICY "Agents can view own transactions" ON public.transactions FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Agents can update own transactions" ON public.transactions FOR UPDATE USING (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Agents can view own messages" ON public.messages FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Agents can update own messages" ON public.messages FOR UPDATE USING (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can manage messages" ON public.messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for deposit_methods (public read)
CREATE POLICY "Anyone can view active deposit methods" ON public.deposit_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage deposit methods" ON public.deposit_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for deposit_requests
CREATE POLICY "Agents can view own deposit requests" ON public.deposit_requests FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Agents can insert deposit requests" ON public.deposit_requests FOR INSERT WITH CHECK (
  agent_id IN (SELECT id FROM public.agents WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can manage deposit requests" ON public.deposit_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for settings (public read)
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin users" ON public.admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();