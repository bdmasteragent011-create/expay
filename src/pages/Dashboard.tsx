import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { StatCard } from '@/components/StatCard';
import { MessageBox } from '@/components/MessageBox';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Percent, 
  CreditCard,
  Loader2 
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function Dashboard() {
  const { agent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingPayIn, setPendingPayIn] = useState(0);
  const [pendingPayOut, setPendingPayOut] = useState(0);

  useEffect(() => {
    if (!authLoading && !agent) {
      navigate('/login');
    }
  }, [agent, authLoading, navigate]);

  useEffect(() => {
    if (agent) {
      fetchMessages();
      fetchPendingTransactions();
    }
  }, [agent]);

  const fetchMessages = async () => {
    if (!agent) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const fetchPendingTransactions = async () => {
    if (!agent) return;
    
    const { data: payInData } = await supabase
      .from('transactions')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('type', 'pay_in')
      .eq('status', 'pending');

    const { data: payOutData } = await supabase
      .from('transactions')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('type', 'pay_out')
      .eq('status', 'pending');

    setPendingPayIn(payInData?.length || 0);
    setPendingPayOut(payOutData?.length || 0);
  };

  if (authLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <Header />
      
      <main className="p-4 space-y-4">
        {/* Available Credits */}
        <div 
          className="card-3d rounded-3xl p-6 animate-slide-up"
          style={{ 
            background: 'var(--gradient-primary)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-primary-foreground/80">Available Credits</p>
              <p className="text-3xl font-bold text-primary-foreground">
                ৳{agent.available_credits.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-full h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-foreground/60 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((agent.available_credits / (agent.max_credit || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="relative"
            onClick={() => navigate('/pay-in-requests')}
          >
            <StatCard
              label="Total Pay In"
              value={agent.total_pay_in}
              icon={ArrowDownCircle}
              variant="success"
            />
            {pendingPayIn > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse-soft">
                {pendingPayIn}
              </span>
            )}
          </div>

          <div 
            className="relative"
            onClick={() => navigate('/pay-out-requests')}
          >
            <StatCard
              label="Total Pay Out"
              value={agent.total_pay_out}
              icon={ArrowUpCircle}
              variant="warning"
            />
            {pendingPayOut > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse-soft">
                {pendingPayOut}
              </span>
            )}
          </div>

          <StatCard
            label="Commission Balance"
            value={agent.commission_balance}
            icon={Percent}
            variant="accent"
          />

          <StatCard
            label="Max Credit"
            value={agent.max_credit}
            icon={CreditCard}
            variant="primary"
          />
        </div>

        {/* Messages */}
        <MessageBox messages={messages} />
      </main>

      <BottomNav />
    </div>
  );
}
