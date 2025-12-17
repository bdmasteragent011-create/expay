import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Wallet,
  MessageCircle,
  Headphones,
  LogOut,
  Loader2,
  Power
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  id: string;
  wallet_number: string;
  balance: number;
  is_active: boolean;
}

interface Settings {
  telegram_link: string | null;
  live_chat_link: string | null;
}

export default function Account() {
  const { agent, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (!authLoading && !agent) {
      navigate('/login');
    }
  }, [agent, authLoading, navigate]);

  useEffect(() => {
    if (agent) {
      fetchWallets();
      fetchSettings();
    }
  }, [agent]);

  const fetchWallets = async () => {
    if (!agent) return;
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: true });

    if (data) {
      setWallets(data as Wallet[]);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('telegram_link, live_chat_link')
      .single();

    if (data) {
      setSettings(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been logged out successfully',
    });
    navigate('/login');
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
        {/* Agent Information */}
        <div className="card-3d rounded-2xl bg-card p-5 animate-slide-up">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Agent Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{agent.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{agent.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{agent.phone || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Agent ID</p>
                <p className="font-medium text-foreground">{agent.agent_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">District</p>
                <p className="font-medium text-foreground">{agent.district || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="card-3d rounded-2xl bg-card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Wallet Information
          </h3>
          
          {wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No wallets added yet</p>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet, index) => (
                <div 
                  key={wallet.id}
                  className={`p-4 rounded-xl border transition-all ${
                    wallet.is_active 
                      ? 'bg-success/5 border-success/20' 
                      : 'bg-muted/50 border-border opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Wallet {index + 1}</p>
                    <div className={`flex items-center gap-1 text-xs ${
                      wallet.is_active ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      <Power className="w-3 h-3" />
                      {wallet.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Number: {wallet.wallet_number}</p>
                  <p className="text-lg font-bold text-foreground">৳{wallet.balance.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit Credit Button */}
        <Button 
          onClick={() => navigate('/deposit')}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg btn-3d animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Deposit Credit
        </Button>

        {/* Support Buttons */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button 
            variant="outline"
            onClick={() => settings?.telegram_link && window.open(settings.telegram_link, '_blank')}
            disabled={!settings?.telegram_link}
            className="h-12 rounded-xl border-primary/20 hover:bg-primary/5"
          >
            <MessageCircle className="w-4 h-4 mr-2 text-primary" />
            Telegram Chat
          </Button>

          <Button 
            variant="outline"
            onClick={() => settings?.live_chat_link && window.open(settings.live_chat_link, '_blank')}
            disabled={!settings?.live_chat_link}
            className="h-12 rounded-xl border-accent/20 hover:bg-accent/5"
          >
            <Headphones className="w-4 h-4 mr-2 text-accent" />
            Live Chat
          </Button>
        </div>

        {/* Sign Out */}
        <Button 
          variant="ghost"
          onClick={handleSignOut}
          className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
