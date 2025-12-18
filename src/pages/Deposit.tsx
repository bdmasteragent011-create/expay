import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
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
  Loader2,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DepositMethod {
  id: string;
  name: string;
  number: string | null;
  instructions: string | null;
  is_active: boolean;
  image_url: string | null;
}

interface DepositRequest {
  id: string;
  amount_usdt: number;
  amount_bdt: number;
  status: 'processing' | 'approved' | 'rejected';
  created_at: string;
  transaction_id: string | null;
  deposit_methods: { name: string } | null;
}

export default function Deposit() {
  const { agent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [usdt, setUsdt] = useState('');
  const [bdt, setBdt] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [dollarRate, setDollarRate] = useState(125);
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [history, setHistory] = useState<DepositRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

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
      .order('created_at', { ascending: false });
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
    if (!agent || !selectedMethod || !usdt || !bdt || !transactionId.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill all fields including Transaction ID and select a method',
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
        transaction_id: transactionId.trim(),
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
      setTransactionId('');
      setSelectedMethod(null);
      fetchHistory();
    }

    setIsSubmitting(false);
  };

  if (authLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#6a4cff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 bg-white relative overflow-hidden">
      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.04) 100%)'
      }} />
      
      {/* Bokeh blobs */}
      <div 
        className="fixed top-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{
          background: '#c7b8ff',
          opacity: 0.12,
          filter: 'blur(80px)',
        }}
      />
      <div 
        className="fixed top-[50%] left-[-15%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: '#8a63ff',
          opacity: 0.1,
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="fixed bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none z-0"
        style={{
          background: '#5ee6c5',
          opacity: 0.15,
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="fixed bottom-[-5%] left-[20%] w-[200px] h-[200px] rounded-full pointer-events-none z-0"
        style={{
          background: '#2fd3b0',
          opacity: 0.08,
          filter: 'blur(50px)',
        }}
      />

      <Header />
      
      <main className="p-4 space-y-4 relative z-10">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 transition-colors"
          style={{ color: '#7a7f99' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Available Credits */}
        <div 
          className="rounded-2xl p-4 animate-slide-up"
          style={{
            background: '#ffffff',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #5b4bff, #20d3a1)',
                boxShadow: '0 8px 20px rgba(91,75,255,0.25)',
              }}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
                }}
              />
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#7a7f99' }}>Available Credits</p>
              <p className="text-xl font-bold" style={{ color: '#1a1a2e' }}>
                ৳{agent.available_credits.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Enter Amount */}
        <div 
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            background: '#ffffff',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            animationDelay: '0.1s',
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: '#1a1a2e' }}>Enter Amount</h3>
          
          <div className="space-y-4">
            <div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9aa0a6' }} />
                <Input
                  type="number"
                  placeholder="USDT Amount"
                  value={usdt}
                  onChange={(e) => handleUsdtChange(e.target.value)}
                  className="pl-11 h-12 text-lg font-semibold"
                  style={{
                    background: '#f4f5f7',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1a1a2e',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#7a7f99' }}>1$ = {dollarRate} TK</p>
            </div>

            <div>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9aa0a6' }} />
                <Input
                  type="number"
                  placeholder="BDT Amount"
                  value={bdt}
                  onChange={(e) => handleBdtChange(e.target.value)}
                  className="pl-11 h-12 text-lg font-semibold"
                  style={{
                    background: '#f4f5f7',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1a1a2e',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#7a7f99' }}>{dollarRate} TK = 1$</p>
            </div>
          </div>
        </div>

        {/* Select Method */}
        <div 
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            background: '#ffffff',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            animationDelay: '0.2s',
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: '#1a1a2e' }}>Select Method</h3>
          
          <div className="grid grid-cols-3 gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className="p-3 text-sm font-medium transition-all flex flex-col items-center gap-2"
                style={{
                  borderRadius: '12px',
                  background: selectedMethod?.id === method.id ? 'rgba(106,76,255,0.1)' : '#f4f5f7',
                  border: `1px solid ${selectedMethod?.id === method.id ? 'rgba(106,76,255,0.3)' : 'rgba(0,0,0,0.06)'}`,
                  color: selectedMethod?.id === method.id ? '#6a4cff' : '#7a7f99',
                }}
              >
                {method.image_url && (
                  <img src={method.image_url} alt={method.name} className="w-8 h-8 rounded-lg object-cover" />
                )}
                <span className="text-xs">{method.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {selectedMethod && (
          <div 
            className="rounded-2xl p-5 animate-scale-in"
            style={{
              background: '#ffffff',
              boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {selectedMethod.image_url && (
                <img src={selectedMethod.image_url} alt={selectedMethod.name} className="w-12 h-12 rounded-xl object-cover" />
              )}
              <h3 className="font-semibold" style={{ color: '#1a1a2e' }}>{selectedMethod.name} Instructions</h3>
            </div>
            
            {selectedMethod.number && (
              <div 
                className="flex items-center gap-2 p-3 rounded-xl mb-3"
                style={{
                  background: 'rgba(106,76,255,0.08)',
                  border: '1px solid rgba(106,76,255,0.2)',
                }}
              >
                <p className="flex-1 font-mono text-sm" style={{ color: '#1a1a2e' }}>
                  {selectedMethod.number}
                </p>
                <button 
                  onClick={copyNumber}
                  className="p-2 rounded-lg transition-colors hover:bg-white/50"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5" style={{ color: '#20d3a1' }} />
                  ) : (
                    <Copy className="w-5 h-5" style={{ color: '#6a4cff' }} />
                  )}
                </button>
              </div>
            )}
            
            {selectedMethod.instructions && (
              <p className="text-sm" style={{ color: '#7a7f99' }}>{selectedMethod.instructions}</p>
            )}

            {/* Transaction ID Input */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block" style={{ color: '#1a1a2e' }}>
                Transaction ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9aa0a6' }} />
                <Input
                  type="text"
                  placeholder="Enter your transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="pl-11 h-12 text-base font-medium"
                  style={{
                    background: '#f4f5f7',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1a1a2e',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#7a7f99' }}>
                Enter the transaction ID after sending payment
              </p>
            </div>
          </div>
        )}

        {/* Deposit Button */}
        <button 
          onClick={handleDeposit}
          disabled={isSubmitting || !selectedMethod || !usdt || !transactionId.trim()}
          className="w-full h-14 rounded-2xl font-semibold text-lg text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          style={{
            background: 'linear-gradient(to right, #5b4bff, #20d3a1)',
            boxShadow: '0 12px 30px rgba(32,211,161,0.25), 0 12px 30px rgba(91,75,255,0.20)',
          }}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.35), rgba(255,255,255,0.15), rgba(255,255,255,0.35))',
            }}
          />
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Deposit Now'
          )}
        </button>

        {/* Deposit History */}
        <div 
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            background: '#ffffff',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            animationDelay: '0.3s',
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: '#1a1a2e' }}>Deposit History</h3>
          
          {history.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#7a7f99' }}>No deposits yet</p>
          ) : (
            <>
              <div className="space-y-3">
                {(showAllHistory ? history : history.slice(0, 5)).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-xl"
                    style={{ background: '#f4f5f7' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: '#1a1a2e' }}>
                          ৳{item.amount_bdt.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: '#7a7f99' }}>
                          {item.deposit_methods?.name || 'Unknown'}
                        </p>
                        {item.transaction_id && (
                          <p className="text-xs mt-1" style={{ color: '#7a7f99' }}>
                            TxID: <span className="font-mono">{item.transaction_id}</span>
                          </p>
                        )}
                      </div>
                      <span 
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{
                          background: item.status === 'approved' 
                            ? 'rgba(32,211,161,0.1)' 
                            : item.status === 'rejected'
                            ? 'rgba(239,68,68,0.1)'
                            : 'rgba(245,158,11,0.1)',
                          color: item.status === 'approved' 
                            ? '#20d3a1' 
                            : item.status === 'rejected'
                            ? '#ef4444'
                            : '#f59e0b',
                        }}
                      >
                        {item.status === 'processing' && <Clock className="w-3 h-3" />}
                        {item.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {history.length > 5 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full mt-3 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(106,76,255,0.08)',
                    color: '#6a4cff',
                    border: '1px solid rgba(106,76,255,0.2)',
                  }}
                >
                  {showAllHistory ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      See All History ({history.length - 5} more)
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
