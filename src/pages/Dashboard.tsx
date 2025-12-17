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

  // Realtime subscriptions
  useEffect(() => {
    if (!agent?.id) return;

    // Listen for message changes
    const messagesChannel = supabase
      .channel('dashboard-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          console.log('Messages updated');
          fetchMessages();
        }
      )
      .subscribe();

    // Listen for transaction changes
    const transactionsChannel = supabase
      .channel('dashboard-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          console.log('Transactions updated');
          fetchPendingTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [agent?.id]);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#6a4cff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-white relative overflow-hidden">
      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.04) 100%)'
      }} />
      
      {/* Bokeh blobs */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: '#c7b8ff',
          opacity: 0.12,
          filter: 'blur(80px)',
        }}
      />
      <div 
        className="fixed top-[30%] right-[-15%] w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{
          background: '#8a63ff',
          opacity: 0.1,
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="fixed bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: '#5ee6c5',
          opacity: 0.15,
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="fixed bottom-[40%] right-[10%] w-[200px] h-[200px] rounded-full pointer-events-none z-0"
        style={{
          background: '#2fd3b0',
          opacity: 0.08,
          filter: 'blur(50px)',
        }}
      />

      <Header />
      
      <main className="p-4 space-y-4 relative z-10">
        {/* Available Credits */}
        <div 
          className="rounded-3xl p-6 animate-slide-up relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #5b4bff 0%, #20d3a1 100%)',
            boxShadow: '0 18px 45px rgba(91,75,255,0.25), 0 8px 20px rgba(32,211,161,0.2)',
          }}
        >
          {/* Glossy highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
            }}
          />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/80">Available Credits</p>
              <p className="text-3xl font-bold text-white">
                ৳{agent.available_credits.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((agent.available_credits / (agent.max_credit || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="relative cursor-pointer"
            onClick={() => navigate('/pay-in-requests')}
          >
            <StatCard
              label="Total Pay In"
              value={agent.total_pay_in}
              icon={ArrowDownCircle}
              variant="success"
            />
            {pendingPayIn > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse"
                style={{ background: '#ef4444' }}
              >
                {pendingPayIn}
              </span>
            )}
          </div>

          <div 
            className="relative cursor-pointer"
            onClick={() => navigate('/pay-out-requests')}
          >
            <StatCard
              label="Total Pay Out"
              value={agent.total_pay_out}
              icon={ArrowUpCircle}
              variant="warning"
            />
            {pendingPayOut > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse"
                style={{ background: '#ef4444' }}
              >
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
