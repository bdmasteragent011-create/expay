import { useEffect, useState, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, ArrowLeft, Save, Plus, Trash2, RefreshCw, 
  User, Key, Shield, Wallet, CreditCard, MessageSquare, 
  ArrowDownCircle, ArrowUpCircle, Percent, TrendingUp,
  CheckCircle, XCircle, Clock, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agent_id: string;
  district: string | null;
  activation_code: string;
  available_credits: number;
  total_pay_in: number;
  total_pay_out: number;
  commission_balance: number;
  max_credit: number;
  is_banned: boolean;
  auth_user_id: string | null;
}

interface Wallet {
  id: string;
  wallet_number: string;
  balance: number;
  is_active: boolean;
}

interface DepositRequest {
  id: string;
  amount_usdt: number;
  amount_bdt: number;
  status: string;
  created_at: string;
  deposit_methods?: { name: string } | null;
}

const AdminEditUser = forwardRef<HTMLDivElement>(function AdminEditUser(_, ref) {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  
  // Form states
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', agent_id: '', district: '' });
  const [activationCode, setActivationCode] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [totalPayIn, setTotalPayIn] = useState('');
  const [totalPayOut, setTotalPayOut] = useState('');
  const [commission, setCommission] = useState('');
  const [maxCredit, setMaxCredit] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [payInAmount, setPayInAmount] = useState('');
  const [payInTransactionId, setPayInTransactionId] = useState('');
  const [payOutAmount, setPayOutAmount] = useState('');
  const [payOutMethodName, setPayOutMethodName] = useState('');
  const [payOutMethodNumber, setPayOutMethodNumber] = useState('');
  const [newWallet, setNewWallet] = useState({ wallet_number: '', balance: '0', name: '' });
  
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login/zrx');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin && id) {
      fetchAgent();
    }
  }, [isAdmin, id]);

  const fetchAgent = async () => {
    setIsLoading(true);
    
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentData) {
      setAgent(agentData as unknown as Agent);
      setProfileForm({
        name: agentData.name,
        email: agentData.email,
        phone: agentData.phone || '',
        agent_id: agentData.agent_id,
        district: agentData.district || '',
      });
      setActivationCode(agentData.activation_code);
      setTotalPayIn(String(agentData.total_pay_in || 0));
      setTotalPayOut(String(agentData.total_pay_out || 0));
      setCommission(String(agentData.commission_balance || 0));
      setMaxCredit(String(agentData.max_credit || 0));
    }

    // Fetch wallets
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', id);

    setWallets(walletData || []);

    // Fetch deposit requests
    const { data: depositData } = await supabase
      .from('deposit_requests')
      .select('*, deposit_methods(name)')
      .eq('agent_id', id)
      .order('created_at', { ascending: false });

    setDeposits(depositData || []);
    
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving('profile');
    const { error } = await supabase
      .from('agents')
      .update({
        name: profileForm.name,
        phone: profileForm.phone || null,
        agent_id: profileForm.agent_id,
        district: profileForm.district || null,
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile saved' });
      fetchAgent();
    }
    setSaving(null);
  };

  const handleUpdateActivationCode = async () => {
    setSaving('activation');
    const { error } = await supabase
      .from('agents')
      .update({ activation_code: activationCode })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update activation code', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Activation code updated' });
    }
    setSaving(null);
  };

  const handleBanToggle = async () => {
    if (!agent) return;
    setSaving('ban');
    const { error } = await supabase
      .from('agents')
      .update({ is_banned: !agent.is_banned })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `User ${agent.is_banned ? 'unbanned' : 'banned'}` });
      fetchAgent();
    }
    setSaving(null);
  };

  const handleIncreaseCredits = async () => {
    if (!agent || !creditAmount) return;
    setSaving('credit-inc');
    const newCredits = (agent.available_credits || 0) + Number(creditAmount);
    
    const { error } = await supabase
      .from('agents')
      .update({ available_credits: newCredits })
      .eq('id', id);

    if (!error) {
      await supabase.from('transactions').insert({
        agent_id: id,
        type: 'pay_in',
        amount: Number(creditAmount),
        status: 'accepted',
      });
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to increase credits', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Added ৳${creditAmount} credits` });
      setCreditAmount('');
      fetchAgent();
    }
    setSaving(null);
  };

  const handleDecreaseCredits = async () => {
    if (!agent || !creditAmount) return;
    setSaving('credit-dec');
    const newCredits = Math.max(0, (agent.available_credits || 0) - Number(creditAmount));
    
    const { error } = await supabase
      .from('agents')
      .update({ available_credits: newCredits })
      .eq('id', id);

    if (!error) {
      await supabase.from('transactions').insert({
        agent_id: id,
        type: 'pay_out',
        amount: Number(creditAmount),
        status: 'accepted',
      });
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to decrease credits', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Removed ৳${creditAmount} credits` });
      setCreditAmount('');
      fetchAgent();
    }
    setSaving(null);
  };

  const handleUpdateTotals = async (field: 'total_pay_in' | 'total_pay_out') => {
    setSaving(field);
    const value = field === 'total_pay_in' ? totalPayIn : totalPayOut;
    const { error } = await supabase
      .from('agents')
      .update({ [field]: Number(value) })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Updated successfully' });
    }
    setSaving(null);
  };

  const handleUpdateCommission = async () => {
    setSaving('commission');
    const { error } = await supabase
      .from('agents')
      .update({ commission_balance: Number(commission) })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update commission', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Commission updated' });
    }
    setSaving(null);
  };

  const handleUpdateMaxCredit = async () => {
    setSaving('maxcredit');
    const { error } = await supabase
      .from('agents')
      .update({ max_credit: Number(maxCredit) })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update max credit', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Max credit updated' });
    }
    setSaving(null);
  };

  const handleAddWallet = async () => {
    if (!newWallet.wallet_number) return;
    setSaving('wallet-add');
    const { error } = await supabase.from('wallets').insert({
      agent_id: id,
      wallet_number: newWallet.wallet_number,
      balance: Number(newWallet.balance) || 0,
      is_active: true,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add wallet', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Wallet added' });
      setNewWallet({ wallet_number: '', balance: '0', name: '' });
      fetchAgent();
    }
    setSaving(null);
  };

  const handleToggleWallet = async (wallet: Wallet) => {
    const { error } = await supabase
      .from('wallets')
      .update({ is_active: !wallet.is_active })
      .eq('id', wallet.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to toggle wallet', variant: 'destructive' });
    } else {
      fetchAgent();
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    const { error } = await supabase.from('wallets').delete().eq('id', walletId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete wallet', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Wallet deleted' });
      fetchAgent();
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent) return;
    setSaving('message');
    const { error } = await supabase.from('messages').insert({
      agent_id: id,
      content: messageContent,
      is_read: false,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Message sent' });
      setMessageContent('');
    }
    setSaving(null);
  };

  const handleSendPayRequest = async (type: 'pay_in' | 'pay_out') => {
    const amount = type === 'pay_in' ? payInAmount : payOutAmount;
    if (!amount) return;
    setSaving(type);
    
    const insertData: any = {
      agent_id: id,
      type,
      amount: Number(amount),
      status: 'pending',
    };

    if (type === 'pay_in' && payInTransactionId) {
      insertData.transaction_id = payInTransactionId;
    }
    if (type === 'pay_out') {
      if (payOutMethodName) insertData.method_name = payOutMethodName;
      if (payOutMethodNumber) insertData.method_number = payOutMethodNumber;
    }
    
    const { error } = await supabase.from('transactions').insert(insertData);

    if (error) {
      toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${type === 'pay_in' ? 'Pay In' : 'Pay Out'} request sent` });
      if (type === 'pay_in') {
        setPayInAmount('');
        setPayInTransactionId('');
      } else {
        setPayOutAmount('');
        setPayOutMethodName('');
        setPayOutMethodNumber('');
      }
    }
    setSaving(null);
  };

  const handleDepositAction = async (depositId: string, action: 'approved' | 'rejected') => {
    setSaving(`deposit-${depositId}`);
    const deposit = deposits.find(d => d.id === depositId);
    
    const { error } = await supabase
      .from('deposit_requests')
      .update({ status: action })
      .eq('id', depositId);

    if (!error && action === 'approved' && deposit && agent) {
      // Add credits to user
      await supabase
        .from('agents')
        .update({ available_credits: (agent.available_credits || 0) + deposit.amount_bdt })
        .eq('id', id);
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to update deposit', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Deposit ${action}` });
      fetchAgent();
    }
    setSaving(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <AdminLayout ref={ref}>
        <div className="text-center py-10">
          <p className="text-muted-foreground">User not found</p>
          <Button onClick={() => navigate('/admin/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout ref={ref}>
      <div className="space-y-5">
        {/* Premium Header */}
        <div className="glass-card rounded-2xl p-4 animate-slide-up">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-300 hover:-translate-x-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{agent.name}</h2>
                {!agent.is_banned && (
                  <span className="status-dot status-dot-success" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{agent.email}</p>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold",
              agent.is_banned 
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-success/10 text-success border border-success/20"
            )}>
              {agent.is_banned ? 'Banned' : 'Active'}
            </div>
          </div>
        </div>

        {/* Section A: Profile */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Profile Information</h3>
          </div>
          <div className="grid gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</Label>
              <Input value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} className="h-11 rounded-xl border-border/50 focus:border-primary" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</Label>
              <Input value={profileForm.email} disabled className="h-11 rounded-xl bg-muted/30 border-border/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="h-11 rounded-xl border-border/50" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agent ID</Label>
                <Input value={profileForm.agent_id} onChange={(e) => setProfileForm(p => ({ ...p, agent_id: e.target.value }))} className="h-11 rounded-xl border-border/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</Label>
              <Input value={profileForm.district} onChange={(e) => setProfileForm(p => ({ ...p, district: e.target.value }))} className="h-11 rounded-xl border-border/50" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving === 'profile'} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground btn-glow">
            {saving === 'profile' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
          </Button>
        </div>

        {/* Section B: Activation Code */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Activation Code</h3>
          </div>
          <Input value={activationCode} onChange={(e) => setActivationCode(e.target.value)} className="h-11 rounded-xl font-mono border-border/50" />
          <Button onClick={handleUpdateActivationCode} disabled={saving === 'activation'} variant="outline" className="w-full h-11 rounded-xl border-accent/30 hover:bg-accent/10 hover:border-accent/50">
            {saving === 'activation' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Activation Code'}
          </Button>
        </div>

        {/* Section C: Account Status */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Account Status</h3>
          </div>
          <div className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-colors",
            agent.is_banned 
              ? "bg-destructive/5 border-destructive/20"
              : "bg-success/5 border-success/20"
          )}>
            <div className="flex items-center gap-3">
              {agent.is_banned ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
              <span className="font-medium">Account is {agent.is_banned ? 'Banned' : 'Active'}</span>
            </div>
          </div>
          <Button onClick={handleBanToggle} disabled={saving === 'ban'} variant={agent.is_banned ? "default" : "destructive"} className="w-full h-11 rounded-xl">
            {saving === 'ban' ? <Loader2 className="w-4 h-4 animate-spin" /> : agent.is_banned ? 'Unban User' : 'Ban User'}
          </Button>
        </div>

        {/* Section D: Credits Control - Premium */}
        <div className="card-3d rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-gradient-to-r from-success/20 via-success/10 to-transparent p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">Credits Control</h3>
            </div>
            <div className="relative p-5 rounded-xl bg-card/80 backdrop-blur border border-success/20">
              <Sparkles className="absolute top-3 right-3 w-5 h-5 text-success/40 animate-pulse-soft" />
              <p className="text-xs text-muted-foreground mb-1">Available Credits</p>
              <p className="text-3xl font-bold text-gradient-primary">৳{(agent.available_credits || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="p-5 bg-card space-y-4">
            <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Enter amount" className="h-11 rounded-xl border-border/50" />
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleIncreaseCredits} disabled={saving === 'credit-inc'} className="h-11 rounded-xl bg-success hover:bg-success/90 btn-glow">
                {saving === 'credit-inc' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Increase</>}
              </Button>
              <Button onClick={handleDecreaseCredits} disabled={saving === 'credit-dec'} variant="destructive" className="h-11 rounded-xl">
                {saving === 'credit-dec' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1" />Decrease</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Section E: Totals Control */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Totals Control</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Total Pay In</Label>
                <Input type="number" value={totalPayIn} onChange={(e) => setTotalPayIn(e.target.value)} placeholder="Total Pay In" className="h-11 rounded-xl border-border/50" />
              </div>
              <Button onClick={() => handleUpdateTotals('total_pay_in')} disabled={saving === 'total_pay_in'} className="h-11 rounded-xl self-end px-6">
                {saving === 'total_pay_in' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Total Pay Out</Label>
                <Input type="number" value={totalPayOut} onChange={(e) => setTotalPayOut(e.target.value)} placeholder="Total Pay Out" className="h-11 rounded-xl border-border/50" />
              </div>
              <Button onClick={() => handleUpdateTotals('total_pay_out')} disabled={saving === 'total_pay_out'} className="h-11 rounded-xl self-end px-6">
                {saving === 'total_pay_out' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
          </div>
        </div>

        {/* Section F: Commission & Max Credit */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Commission & Max Credit</h3>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Commission Balance</Label>
              <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Commission" className="h-11 rounded-xl border-border/50" />
            </div>
            <Button onClick={handleUpdateCommission} disabled={saving === 'commission'} className="h-11 rounded-xl self-end px-6">
              {saving === 'commission' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </Button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Credit Limit</Label>
              <Input type="number" value={maxCredit} onChange={(e) => setMaxCredit(e.target.value)} placeholder="Max Credit" className="h-11 rounded-xl border-border/50" />
            </div>
            <Button onClick={handleUpdateMaxCredit} disabled={saving === 'maxcredit'} className="h-11 rounded-xl self-end px-6">
              {saving === 'maxcredit' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </Button>
          </div>
        </div>

        {/* Section G: Wallets */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Wallet Management</h3>
          </div>
          {wallets.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-muted/20 border border-dashed border-border">
              <CreditCard className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No wallets configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet, index) => (
                <div key={wallet.id} className={cn(
                  "p-4 rounded-xl border transition-all",
                  wallet.is_active 
                    ? "bg-success/5 border-success/20" 
                    : "bg-muted/30 border-border/50"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                        wallet.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{wallet.wallet_number}</p>
                        <p className="text-sm text-muted-foreground">Balance: ৳{wallet.balance.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteWallet(wallet.id)} className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className={cn("status-dot", wallet.is_active ? "status-dot-success" : "status-dot-destructive")} />
                      <span className="text-sm">{wallet.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <Switch checked={wallet.is_active} onCheckedChange={() => handleToggleWallet(wallet)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <Label className="text-xs font-medium text-muted-foreground">Add New Wallet</Label>
            <Input 
              value={newWallet.wallet_number} 
              onChange={(e) => setNewWallet(p => ({ ...p, wallet_number: e.target.value }))} 
              placeholder="Enter wallet number" 
              className="h-11 rounded-xl border-border/50" 
            />
            <Button onClick={handleAddWallet} disabled={saving === 'wallet-add' || !newWallet.wallet_number} className="w-full h-11 rounded-xl gradient-accent text-accent-foreground btn-glow">
              {saving === 'wallet-add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Wallet</>}
            </Button>
          </div>
        </div>

        {/* Section H: Messages */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Send Message</h3>
          </div>
          <Textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Write your message to this agent..." className="rounded-xl min-h-[100px] border-border/50 resize-none" />
          <Button onClick={handleSendMessage} disabled={saving === 'message' || !messageContent} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground btn-glow">
            {saving === 'message' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageSquare className="w-4 h-4 mr-2" />Send Message</>}
          </Button>
        </div>

        {/* Section I: Pay In Requests */}
        <div className="card-3d rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '450ms' }}>
          <div className="bg-gradient-to-r from-success/20 via-success/10 to-transparent p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">Send Pay In Request</h3>
            </div>
          </div>
          <div className="p-5 bg-card space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</Label>
              <Input 
                type="number" 
                value={payInAmount} 
                onChange={(e) => setPayInAmount(e.target.value)} 
                placeholder="Enter amount" 
                className="h-11 rounded-xl border-border/50" 
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Transaction ID (optional)</Label>
              <Input 
                value={payInTransactionId} 
                onChange={(e) => setPayInTransactionId(e.target.value)} 
                placeholder="Enter transaction ID" 
                className="h-11 rounded-xl border-border/50" 
              />
            </div>
            <Button onClick={() => handleSendPayRequest('pay_in')} disabled={saving === 'pay_in' || !payInAmount} className="w-full h-11 rounded-xl bg-success hover:bg-success/90 btn-glow">
              {saving === 'pay_in' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowDownCircle className="w-4 h-4 mr-2" />Send Pay In Request</>}
            </Button>
          </div>
        </div>

        {/* Section J: Pay Out Requests */}
        <div className="card-3d rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">Send Pay Out Request</h3>
            </div>
          </div>
          <div className="p-5 bg-card space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</Label>
              <Input 
                type="number" 
                value={payOutAmount} 
                onChange={(e) => setPayOutAmount(e.target.value)} 
                placeholder="Enter amount" 
                className="h-11 rounded-xl border-border/50" 
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Method Name</Label>
              <Input 
                value={payOutMethodName} 
                onChange={(e) => setPayOutMethodName(e.target.value)} 
                placeholder="e.g., Bkash, Nagad, Rocket" 
                className="h-11 rounded-xl border-border/50" 
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Method Number</Label>
              <Input 
                value={payOutMethodNumber} 
                onChange={(e) => setPayOutMethodNumber(e.target.value)} 
                placeholder="Enter phone/account number" 
                className="h-11 rounded-xl border-border/50" 
              />
            </div>
            <Button onClick={() => handleSendPayRequest('pay_out')} disabled={saving === 'pay_out' || !payOutAmount} variant="destructive" className="w-full h-11 rounded-xl">
              {saving === 'pay_out' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowUpCircle className="w-4 h-4 mr-2" />Send Pay Out Request</>}
            </Button>
          </div>
        </div>

        {/* Section K: Deposit Requests */}
        <div className="card-3d rounded-2xl bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '550ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Deposit Requests</h3>
          </div>
          {deposits.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-muted/20 border border-dashed border-border">
              <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No deposit requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-bold">${deposit.amount_usdt} <span className="text-muted-foreground font-normal text-sm">/ ৳{deposit.amount_bdt}</span></p>
                      <p className="text-sm text-muted-foreground">{deposit.deposit_methods?.name || 'Unknown method'}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold",
                      deposit.status === 'approved' ? "bg-success/10 text-success border border-success/20" :
                      deposit.status === 'rejected' ? "bg-destructive/10 text-destructive border border-destructive/20" :
                      "bg-warning/10 text-warning border border-warning/20"
                    )}>
                      {deposit.status}
                    </span>
                  </div>
                  {deposit.status === 'processing' && (
                    <div className="flex gap-3 pt-3 border-t border-border/50">
                      <Button onClick={() => handleDepositAction(deposit.id, 'approved')} disabled={saving === `deposit-${deposit.id}`} className="flex-1 h-10 rounded-xl bg-success hover:bg-success/90">
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button onClick={() => handleDepositAction(deposit.id, 'rejected')} disabled={saving === `deposit-${deposit.id}`} variant="destructive" className="flex-1 h-10 rounded-xl">
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
});

export default AdminEditUser;
