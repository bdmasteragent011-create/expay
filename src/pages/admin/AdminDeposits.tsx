import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, Search, CheckCircle, XCircle, Clock, 
  DollarSign, User, Calendar, Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DepositRequest {
  id: string;
  amount_usdt: number;
  amount_bdt: number;
  status: 'processing' | 'approved' | 'rejected';
  created_at: string;
  transaction_id: string | null;
  agent_id: string;
  agents: { name: string; email: string; agent_id: string } | null;
  deposit_methods: { name: string } | null;
}

export default function AdminDeposits() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'processing' | 'approved' | 'rejected'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login/zrx');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchDeposits();

      // Realtime subscription
      const channel = supabase
        .channel('admin-deposits-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, () => {
          console.log('Deposits updated');
          fetchDeposits();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    filterDeposits();
  }, [deposits, search, filter]);

  const fetchDeposits = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('deposit_requests')
      .select('*, agents(name, email, agent_id), deposit_methods(name)')
      .order('created_at', { ascending: false });

    setDeposits(data as DepositRequest[] || []);
    setIsLoading(false);
  };

  const filterDeposits = () => {
    let filtered = [...deposits];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.agents?.name.toLowerCase().includes(searchLower) ||
          d.agents?.email.toLowerCase().includes(searchLower) ||
          d.agents?.agent_id.toLowerCase().includes(searchLower) ||
          d.transaction_id?.toLowerCase().includes(searchLower) ||
          d.deposit_methods?.name.toLowerCase().includes(searchLower)
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter((d) => d.status === filter);
    }

    setFilteredDeposits(filtered);
  };

  const handleAction = async (depositId: string, action: 'approved' | 'rejected') => {
    setProcessing(depositId);
    const deposit = deposits.find(d => d.id === depositId);

    if (action === 'approved' && deposit) {
      // Check max credit before approving
      const { data: agent } = await supabase
        .from('agents')
        .select('available_credits, max_credit')
        .eq('id', deposit.agent_id)
        .single();

      if (agent) {
        const newBalance = (agent.available_credits || 0) + deposit.amount_bdt;
        const maxCredit = agent.max_credit || 0;

        if (maxCredit > 0 && newBalance > maxCredit) {
          toast({ 
            title: 'Max Credit Exceeded', 
            description: `This deposit would exceed the user's max credit limit of ৳${maxCredit.toLocaleString()}. Current balance: ৳${(agent.available_credits || 0).toLocaleString()}`,
            variant: 'destructive' 
          });
          setProcessing(null);
          return;
        }
      }
    }

    const { error } = await supabase
      .from('deposit_requests')
      .update({ status: action })
      .eq('id', depositId);

    if (!error && action === 'approved' && deposit) {
      // Add credits to user
      const { data: agent } = await supabase
        .from('agents')
        .select('available_credits')
        .eq('id', deposit.agent_id)
        .single();

      if (agent) {
        await supabase
          .from('agents')
          .update({ available_credits: (agent.available_credits || 0) + deposit.amount_bdt })
          .eq('id', deposit.agent_id);
      }
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to update deposit', variant: 'destructive' });
    } else {
      toast({ 
        title: 'Success', 
        description: action === 'approved' 
          ? `Deposit approved and ৳${deposit?.amount_bdt.toLocaleString()} added to user`
          : 'Deposit rejected'
      });
      fetchDeposits();
    }
    setProcessing(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/10 text-success">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Deposit Requests</h2>
          <span className="text-sm text-muted-foreground">
            {filteredDeposits.filter(d => d.status === 'processing').length} pending
          </span>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, TxID..."
              className="pl-11 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'processing', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Deposits List */}
        <div className="space-y-3">
          {filteredDeposits.length === 0 ? (
            <div className="card-3d rounded-2xl bg-card p-8 text-center">
              <p className="text-muted-foreground">No deposit requests found</p>
            </div>
          ) : (
            filteredDeposits.map((deposit) => (
              <div key={deposit.id} className="card-3d rounded-2xl bg-card p-4 space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">৳{deposit.amount_bdt.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">${deposit.amount_usdt.toFixed(2)} USDT</p>
                    </div>
                  </div>
                  {getStatusBadge(deposit.status)}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{deposit.agents?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(deposit.created_at), 'MMM d, HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Method:</span>
                    <span>{deposit.deposit_methods?.name || 'N/A'}</span>
                  </div>
                  {deposit.transaction_id && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs truncate">{deposit.transaction_id}</span>
                    </div>
                  )}
                </div>

                {/* Actions for pending */}
                {deposit.status === 'processing' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAction(deposit.id, 'approved')}
                      disabled={processing === deposit.id}
                      className="flex-1 rounded-xl bg-success hover:bg-success/90"
                    >
                      {processing === deposit.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(deposit.id, 'rejected')}
                      disabled={processing === deposit.id}
                      className="flex-1 rounded-xl"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}