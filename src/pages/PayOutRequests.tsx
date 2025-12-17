import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { TransactionItem } from '@/components/TransactionItem';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'pay_in' | 'pay_out';
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  method_name: string | null;
  method_number: string | null;
}

export default function PayOutRequests() {
  const { agent, refreshAgent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !agent) {
      navigate('/login');
    }
  }, [agent, authLoading, navigate]);

  useEffect(() => {
    if (agent) {
      fetchTransactions();
    }
  }, [agent]);

  const fetchTransactions = async () => {
    if (!agent) return;
    
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('type', 'pay_out')
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data as Transaction[]);
    }
    setIsLoading(false);
  };

  const handleAccept = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction || !agent) return;

    // Check if agent has enough balance
    if (agent.available_credits < transaction.amount) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough credits for this payout',
        variant: 'destructive',
      });
      return;
    }

    // Update transaction status
    const { error: txError } = await supabase
      .from('transactions')
      .update({ status: 'accepted' })
      .eq('id', id);

    if (txError) {
      toast({
        title: 'Error',
        description: 'Failed to accept transaction',
        variant: 'destructive',
      });
      return;
    }

    // Update agent balance
    const { error: agentError } = await supabase
      .from('agents')
      .update({ 
        available_credits: agent.available_credits - transaction.amount,
        total_pay_out: agent.total_pay_out + transaction.amount
      })
      .eq('id', agent.id);

    if (agentError) {
      toast({
        title: 'Error',
        description: 'Failed to update balance',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success!',
      description: `৳${transaction.amount.toLocaleString()} deducted from your balance`,
    });

    await refreshAgent();
    fetchTransactions();
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject transaction',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Rejected',
      description: 'Transaction has been rejected',
    });

    fetchTransactions();
  };

  if (authLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const completedTransactions = transactions.filter(t => t.status !== 'pending');

  return (
    <div className="min-h-screen pb-6">
      <Header />
      
      <main className="p-4 space-y-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        <h2 className="text-xl font-bold text-foreground">Pay Out Requests</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-3d rounded-2xl bg-card p-8 text-center animate-fade-in">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pay out requests</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingTransactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending</h3>
                {pendingTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    id={tx.id}
                    type={tx.type}
                    amount={tx.amount}
                    status={tx.status}
                    createdAt={tx.created_at}
                    methodName={tx.method_name}
                    methodNumber={tx.method_number}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}

            {completedTransactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">History</h3>
                {completedTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    id={tx.id}
                    type={tx.type}
                    amount={tx.amount}
                    status={tx.status}
                    createdAt={tx.created_at}
                    methodName={tx.method_name}
                    methodNumber={tx.method_number}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
