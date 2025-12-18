import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { TransactionItem } from '@/components/TransactionItem';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, Inbox, History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  type: 'pay_in' | 'pay_out';
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  transaction_id: string | null;
  method_name: string | null;
  method_number: string | null;
}

export default function PayInRequests() {
  const { agent, refreshAgent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  // Realtime subscription for transactions
  useEffect(() => {
    if (!agent?.id) return;

    const channel = supabase
      .channel('payin-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          console.log('Pay-in transactions updated');
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id]);

  const fetchTransactions = async () => {
    if (!agent) return;
    
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('type', 'pay_in')
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data as Transaction[]);
    }
    setIsLoading(false);
  };

  const handleAccept = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction || !agent) return;

    setProcessingId(id);
    const { data, error } = await supabase.functions.invoke('accept-transaction', {
      body: { transactionId: id, action: 'accept' }
    });

    if (error || data?.error) {
      toast({
        title: 'Error',
        description: data?.error || 'Failed to accept transaction',
        variant: 'destructive',
      });
      setProcessingId(null);
      return;
    }

    toast({
      title: 'Success!',
      description: data?.message || `৳${transaction.amount.toLocaleString()} added to your balance`,
    });

    await refreshAgent();
    fetchTransactions();
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const { data, error } = await supabase.functions.invoke('accept-transaction', {
      body: { transactionId: id, action: 'reject' }
    });

    if (error || data?.error) {
      toast({
        title: 'Error',
        description: data?.error || 'Failed to reject transaction',
        variant: 'destructive',
      });
      setProcessingId(null);
      return;
    }

    toast({
      title: 'Rejected',
      description: 'Transaction has been rejected',
    });

    fetchTransactions();
    setProcessingId(null);
  };

  const handleClearHistory = async () => {
    if (!agent) return;
    
    setIsClearing(true);
    const historyIds = transactions
      .filter(t => t.status !== 'pending')
      .map(t => t.id);
    
    if (historyIds.length === 0) {
      setIsClearing(false);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', historyIds);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear history',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Cleared',
        description: 'History has been cleared',
      });
      fetchTransactions();
    }
    setIsClearing(false);
  };

  if (authLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const historyTransactions = transactions.filter(t => t.status !== 'pending');
  const displayedHistory = showAllHistory ? historyTransactions : historyTransactions.slice(0, 5);

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

        <h2 className="text-xl font-bold text-foreground">Pay In Requests</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pendingTransactions.length === 0 ? (
          <div className="card-3d rounded-2xl bg-card p-8 text-center animate-fade-in">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending pay in requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                id={tx.id}
                type={tx.type}
                amount={tx.amount}
                status={tx.status}
                createdAt={tx.created_at}
                transactionId={tx.transaction_id}
                methodName={tx.method_name}
                methodNumber={tx.method_number}
                onAccept={handleAccept}
                onReject={handleReject}
                isProcessing={processingId === tx.id}
              />
            ))}
          </div>
        )}

        {/* History Section */}
        {historyTransactions.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <History className="w-5 h-5" />
                <h3 className="font-semibold">History</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-3">
              {displayedHistory.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  id={tx.id}
                  type={tx.type}
                  amount={tx.amount}
                  status={tx.status}
                  createdAt={tx.created_at}
                  transactionId={tx.transaction_id}
                  methodName={tx.method_name}
                  methodNumber={tx.method_number}
                />
              ))}
            </div>

            {historyTransactions.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full flex items-center gap-2"
              >
                {showAllHistory ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    See All History ({historyTransactions.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}