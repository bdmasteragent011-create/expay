import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
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

export default function AdminEditUser() {
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
  const [payOutAmount, setPayOutAmount] = useState('');
  const [newWallet, setNewWallet] = useState({ wallet_number: '', balance: '0' });
  
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
      setNewWallet({ wallet_number: '', balance: '0' });
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
    
    const { error } = await supabase.from('transactions').insert({
      agent_id: id,
      type,
      amount: Number(amount),
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${type === 'pay_in' ? 'Pay In' : 'Pay Out'} request sent` });
      if (type === 'pay_in') setPayInAmount('');
      else setPayOutAmount('');
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
      <AdminLayout>
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
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">{agent.name}</h2>
            <p className="text-sm text-muted-foreground">{agent.email}</p>
          </div>
        </div>

        {/* Section A: Profile */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Profile</h3>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} className="h-10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Email (Read Only)</Label>
              <Input value={profileForm.email} disabled className="h-10 rounded-xl bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Agent ID</Label>
                <Input value={profileForm.agent_id} onChange={(e) => setProfileForm(p => ({ ...p, agent_id: e.target.value }))} className="h-10 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs">District</Label>
              <Input value={profileForm.district} onChange={(e) => setProfileForm(p => ({ ...p, district: e.target.value }))} className="h-10 rounded-xl" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving === 'profile'} className="w-full h-10 rounded-xl">
            {saving === 'profile' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
          </Button>
        </div>

        {/* Section B: Activation Code */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Activation Code</h3>
          <Input value={activationCode} onChange={(e) => setActivationCode(e.target.value)} className="h-10 rounded-xl" />
          <Button onClick={handleUpdateActivationCode} disabled={saving === 'activation'} variant="outline" className="w-full h-10 rounded-xl">
            {saving === 'activation' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Code'}
          </Button>
        </div>

        {/* Section C: Account Status */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Account Status</h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span>Status: <span className={cn("font-semibold", agent.is_banned ? "text-destructive" : "text-success")}>{agent.is_banned ? 'Banned' : 'Active'}</span></span>
          </div>
          <Button onClick={handleBanToggle} disabled={saving === 'ban'} variant={agent.is_banned ? "default" : "destructive"} className="w-full h-10 rounded-xl">
            {saving === 'ban' ? <Loader2 className="w-4 h-4 animate-spin" /> : agent.is_banned ? 'Unban User' : 'Ban User'}
          </Button>
        </div>

        {/* Section D: Credits Control */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Credits Control</h3>
          <div className="p-3 rounded-xl bg-success/10 text-center">
            <p className="text-xs text-muted-foreground">Available Credits</p>
            <p className="text-2xl font-bold text-success">৳{(agent.available_credits || 0).toLocaleString()}</p>
          </div>
          <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Amount" className="h-10 rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleIncreaseCredits} disabled={saving === 'credit-inc'} className="h-10 rounded-xl bg-success hover:bg-success/90">
              {saving === 'credit-inc' ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Increase'}
            </Button>
            <Button onClick={handleDecreaseCredits} disabled={saving === 'credit-dec'} variant="destructive" className="h-10 rounded-xl">
              {saving === 'credit-dec' ? <Loader2 className="w-4 h-4 animate-spin" /> : '- Decrease'}
            </Button>
          </div>
        </div>

        {/* Section E: Totals Control */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Totals Control</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input type="number" value={totalPayIn} onChange={(e) => setTotalPayIn(e.target.value)} placeholder="Total Pay In" className="h-10 rounded-xl flex-1" />
              <Button onClick={() => handleUpdateTotals('total_pay_in')} disabled={saving === 'total_pay_in'} size="sm" className="h-10 rounded-xl">
                {saving === 'total_pay_in' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input type="number" value={totalPayOut} onChange={(e) => setTotalPayOut(e.target.value)} placeholder="Total Pay Out" className="h-10 rounded-xl flex-1" />
              <Button onClick={() => handleUpdateTotals('total_pay_out')} disabled={saving === 'total_pay_out'} size="sm" className="h-10 rounded-xl">
                {saving === 'total_pay_out' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
          </div>
        </div>

        {/* Section F: Commission & Max Credit */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Commission & Max Credit</h3>
          <div className="flex gap-2">
            <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Commission" className="h-10 rounded-xl flex-1" />
            <Button onClick={handleUpdateCommission} disabled={saving === 'commission'} size="sm" className="h-10 rounded-xl">
              {saving === 'commission' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input type="number" value={maxCredit} onChange={(e) => setMaxCredit(e.target.value)} placeholder="Max Credit" className="h-10 rounded-xl flex-1" />
            <Button onClick={handleUpdateMaxCredit} disabled={saving === 'maxcredit'} size="sm" className="h-10 rounded-xl">
              {saving === 'maxcredit' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </Button>
          </div>
        </div>

        {/* Section G: Wallets */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Wallets</h3>
          {wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No wallets</p>
          ) : (
            <div className="space-y-2">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{wallet.wallet_number}</p>
                    <p className="text-xs text-muted-foreground">৳{wallet.balance}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={wallet.is_active} onCheckedChange={() => handleToggleWallet(wallet)} />
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteWallet(wallet.id)} className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Input value={newWallet.wallet_number} onChange={(e) => setNewWallet(p => ({ ...p, wallet_number: e.target.value }))} placeholder="Number" className="h-10 rounded-xl col-span-2" />
            <Button onClick={handleAddWallet} disabled={saving === 'wallet-add'} className="h-10 rounded-xl">
              {saving === 'wallet-add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Section H: Messages */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Send Message</h3>
          <Textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Write message..." className="rounded-xl min-h-[80px]" />
          <Button onClick={handleSendMessage} disabled={saving === 'message'} className="w-full h-10 rounded-xl">
            {saving === 'message' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Message'}
          </Button>
        </div>

        {/* Section I & J: Pay Requests */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Pay Requests</h3>
          <div className="flex gap-2">
            <Input type="number" value={payInAmount} onChange={(e) => setPayInAmount(e.target.value)} placeholder="Pay In Amount" className="h-10 rounded-xl flex-1" />
            <Button onClick={() => handleSendPayRequest('pay_in')} disabled={saving === 'pay_in'} className="h-10 rounded-xl bg-success hover:bg-success/90">
              {saving === 'pay_in' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Pay In'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input type="number" value={payOutAmount} onChange={(e) => setPayOutAmount(e.target.value)} placeholder="Pay Out Amount" className="h-10 rounded-xl flex-1" />
            <Button onClick={() => handleSendPayRequest('pay_out')} disabled={saving === 'pay_out'} variant="destructive" className="h-10 rounded-xl">
              {saving === 'pay_out' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Pay Out'}
            </Button>
          </div>
        </div>

        {/* Section K: Deposit Requests */}
        <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold text-primary">Deposit Requests</h3>
          {deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No deposit requests</p>
          ) : (
            <div className="space-y-2">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="p-3 rounded-xl bg-muted/30 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">${deposit.amount_usdt} / ৳{deposit.amount_bdt}</p>
                      <p className="text-xs text-muted-foreground">{deposit.deposit_methods?.name || 'Unknown'}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium h-fit",
                      deposit.status === 'approved' ? "bg-success/10 text-success" :
                      deposit.status === 'rejected' ? "bg-destructive/10 text-destructive" :
                      "bg-warning/10 text-warning"
                    )}>
                      {deposit.status}
                    </span>
                  </div>
                  {deposit.status === 'processing' && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleDepositAction(deposit.id, 'approved')} disabled={saving === `deposit-${deposit.id}`} size="sm" className="flex-1 h-8 rounded-lg bg-success hover:bg-success/90">
                        Approve
                      </Button>
                      <Button onClick={() => handleDepositAction(deposit.id, 'rejected')} disabled={saving === `deposit-${deposit.id}`} size="sm" variant="destructive" className="flex-1 h-8 rounded-lg">
                        Reject
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
}
