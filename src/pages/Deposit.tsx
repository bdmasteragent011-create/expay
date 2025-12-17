import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Wallet, 
  DollarSign, 
  Banknote,
  Copy,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DepositMethod {
  id: string;
  name: string;
  number: string | null;
  instructions: string | null;
  is_active: boolean;
}

interface DepositRequest {
  id: string;
  amount_usdt: number;
  amount_bdt: number;
  status: 'processing' | 'approved' | 'rejected';
  created_at: string;
  deposit_methods: { name: string } | null;
}

export default function Deposit() {
  const { agent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [usdt, setUsdt] = useState('');
  const [bdt, setBdt] = useState('');
  const [dollarRate, setDollarRate] = useState(125);
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [history, setHistory] = useState<DepositRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !agent) {
      navigate('/login');
    }
  }, [agent, authLoading, navigate]);

  useEffect(() => {
    fetchSettings();
    fetchMethods();
    if (agent) {
      fetchHistory();
    }
  }, [agent]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('dollar_rate')
      .single();
    if (data) {
      setDollarRate(Number(data.dollar_rate));
    }
  };

  const fetchMethods = async () => {
    const { data } = await supabase
      .from('deposit_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) {
      setMethods(data as DepositMethod[]);
    }
  };

  const fetchHistory = async () => {
    if (!agent) return;
    const { data } = await supabase
      .from('deposit_requests')
      .select('*, deposit_methods(name)')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) {
      setHistory(data as unknown as DepositRequest[]);
    }
  };

  const handleUsdtChange = (value: string) => {
    setUsdt(value);
    if (value) {
      setBdt((parseFloat(value) * dollarRate).toFixed(2));
    } else {
      setBdt('');
    }
  };

  const handleBdtChange = (value: string) => {
    setBdt(value);
    if (value) {
      setUsdt((parseFloat(value) / dollarRate).toFixed(2));
    } else {
      setUsdt('');
    }
  };

  const copyNumber = () => {
    if (selectedMethod?.number) {
      navigator.clipboard.writeText(selectedMethod.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Number copied to clipboard',
      });
    }
  };

  const handleDeposit = async () => {
    if (!agent || !selectedMethod || !usdt || !bdt) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and select a method',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('deposit_requests')
      .insert({
        agent_id: agent.id,
        method_id: selectedMethod.id,
        amount_usdt: parseFloat(usdt),
        amount_bdt: parseFloat(bdt),
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit deposit request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Deposit request submitted',
      });
      setUsdt('');
      setBdt('');
      setSelectedMethod(null);
      fetchHistory();
    }

    setIsSubmitting(false);
  };

  if (authLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      <Header />
      
      <main className="p-4 space-y-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Available Credits */}
        <div className="card-3d rounded-2xl bg-card p-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available Credits</p>
              <p className="text-xl font-bold text-foreground">৳{agent.available_credits.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Enter Amount */}
        <div className="card-3d rounded-2xl bg-card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold text-foreground mb-4">Enter Amount</h3>
          
          <div className="space-y-4">
            <div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="USDT Amount"
                  value={usdt}
                  onChange={(e) => handleUsdtChange(e.target.value)}
                  className="pl-11 h-12 rounded-xl text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">1$ = {dollarRate} TK</p>
            </div>

            <div>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="BDT Amount"
                  value={bdt}
                  onChange={(e) => handleBdtChange(e.target.value)}
                  className="pl-11 h-12 rounded-xl text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{dollarRate} TK = 1$</p>
            </div>
          </div>
        </div>

        {/* Select Method */}
        <div className="card-3d rounded-2xl bg-card p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold text-foreground mb-4">Select Method</h3>
          
          <div className="grid grid-cols-3 gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={cn(
                  "p-3 rounded-xl border text-sm font-medium transition-all",
                  selectedMethod?.id === method.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                )}
              >
                {method.name}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {selectedMethod && (
          <div className="card-3d rounded-2xl bg-card p-5 animate-scale-in">
            <h3 className="font-semibold text-foreground mb-3">Instructions</h3>
            
            {selectedMethod.number && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-3">
                <p className="flex-1 font-mono text-sm text-foreground">{selectedMethod.number}</p>
                <button 
                  onClick={copyNumber}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5 text-primary" />
                  )}
                </button>
              </div>
            )}
            
            {selectedMethod.instructions && (
              <p className="text-sm text-muted-foreground">{selectedMethod.instructions}</p>
            )}
          </div>
        )}

        {/* Deposit Button */}
        <Button 
          onClick={handleDeposit}
          disabled={isSubmitting || !selectedMethod || !usdt}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg btn-3d"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Deposit Now'
          )}
        </Button>

        {/* Deposit History */}
        <div className="card-3d rounded-2xl bg-card p-5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold text-foreground mb-4">Deposit History</h3>
          
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No deposits yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">৳{item.amount_bdt.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{item.deposit_methods?.name || 'Unknown'}</p>
                  </div>
                  <span className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                    item.status === 'approved' 
                      ? "bg-success/10 text-success" 
                      : item.status === 'rejected'
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  )}>
                    {item.status === 'processing' && <Clock className="w-3 h-3" />}
                    {item.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
