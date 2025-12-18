import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
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
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface WalletData {
  id: string;
  wallet_number: string;
  wallet_name: string | null;
  balance: number;
  is_active: boolean;
}

interface Settings {
  telegram_link: string | null;
  live_chat_link: string | null;
  telegram_icon_url: string | null;
  live_chat_icon_url: string | null;
}

export default function Account() {
  const { agent, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [visibleNumbers, setVisibleNumbers] = useState<{[key: string]: boolean}>({});

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

  // Realtime subscription for wallets and settings
  useEffect(() => {
    if (!agent?.id) return;

    const walletsChannel = supabase
      .channel('account-wallets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          console.log('Wallets updated');
          fetchWallets();
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('account-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
        },
        () => {
          console.log('Settings updated');
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [agent?.id]);

  const fetchWallets = async () => {
    if (!agent) return;
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: true });

    if (data) {
      setWallets(data as WalletData[]);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('telegram_link, live_chat_link, telegram_icon_url, live_chat_icon_url')
      .single();

    if (data) {
      setSettings(data as Settings);
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

  const handleToggleWallet = async (walletId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('wallets')
      .update({ is_active: !currentStatus })
      .eq('id', walletId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wallet status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Wallet ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      fetchWallets();
    }
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
        className="fixed top-[-5%] right-[-10%] w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{
          background: '#c7b8ff',
          opacity: 0.12,
          filter: 'blur(80px)',
        }}
      />
      <div 
        className="fixed top-[40%] left-[-15%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: '#8a63ff',
          opacity: 0.1,
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="fixed bottom-[5%] right-[5%] w-[280px] h-[280px] rounded-full pointer-events-none z-0"
        style={{
          background: '#5ee6c5',
          opacity: 0.15,
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="fixed bottom-[35%] left-[10%] w-[200px] h-[200px] rounded-full pointer-events-none z-0"
        style={{
          background: '#2fd3b0',
          opacity: 0.08,
          filter: 'blur(50px)',
        }}
      />

      <Header />
      
      <main className="p-4 space-y-4 relative z-10">
        {/* Agent Information */}
        <div 
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            background: '#ffffff',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
            <User className="w-5 h-5" style={{ color: '#6a4cff' }} />
            Agent Information
          </h3>
          
          <div className="space-y-3">
            {[
              { icon: User, label: 'Name', value: agent.name },
              { icon: Mail, label: 'Email', value: agent.email },
              { icon: Phone, label: 'Phone', value: agent.phone || 'Not set' },
              { icon: CreditCard, label: 'Agent ID', value: agent.agent_id },
              { icon: MapPin, label: 'District', value: agent.district || 'Not set' },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#f4f5f7' }}
              >
                <item.icon className="w-4 h-4" style={{ color: '#9aa0a6' }} />
                <div>
                  <p className="text-xs" style={{ color: '#7a7f99' }}>{item.label}</p>
                  <p className="font-medium" style={{ color: '#1a1a2e' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Information */}
        <div 
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            background: '#ffffff',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            animationDelay: '0.1s',
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
            <Wallet className="w-5 h-5" style={{ color: '#6a4cff' }} />
            Wallet Information
          </h3>
          
          {wallets.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#7a7f99' }}>
              No wallets added yet
            </p>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet, index) => (
                <div 
                  key={wallet.id}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    background: wallet.is_active ? 'rgba(32,211,161,0.08)' : '#f4f5f7',
                    border: `1px solid ${wallet.is_active ? 'rgba(32,211,161,0.2)' : 'rgba(0,0,0,0.06)'}`,
                    opacity: wallet.is_active ? 1 : 0.6,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>
                      {wallet.wallet_name || `Wallet ${index + 1}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: wallet.is_active ? '#20d3a1' : '#7a7f99' }}>
                        {wallet.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={wallet.is_active}
                        onCheckedChange={() => handleToggleWallet(wallet.id, wallet.is_active)}
                        className="data-[state=checked]:bg-[#20d3a1]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs" style={{ color: '#7a7f99' }}>
                      Number: {visibleNumbers[wallet.id] ? wallet.wallet_number : '••••••••••'}
                    </p>
                    <button
                      onClick={() => setVisibleNumbers(prev => ({ ...prev, [wallet.id]: !prev[wallet.id] }))}
                      className="p-1.5 rounded-lg transition-all hover:bg-black/5 active:scale-95"
                      style={{ color: '#7a7f99' }}
                    >
                      {visibleNumbers[wallet.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-lg font-bold" style={{ color: '#1a1a2e' }}>
                    ৳{wallet.balance.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit Credit Button */}
        <button 
          onClick={() => navigate('/deposit')}
          className="w-full h-14 rounded-2xl font-semibold text-lg text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-slide-up flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(to right, #5b4bff, #20d3a1)',
            boxShadow: '0 12px 30px rgba(32,211,161,0.25), 0 12px 30px rgba(91,75,255,0.20)',
            animationDelay: '0.2s',
          }}
        >
          {/* Glossy highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.35), rgba(255,255,255,0.15), rgba(255,255,255,0.35))',
            }}
          />
          <CreditCard className="w-5 h-5" />
          Deposit Credit
        </button>

        {/* Support Buttons */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button 
            onClick={() => settings?.telegram_link && window.open(settings.telegram_link, '_blank')}
            disabled={!settings?.telegram_link}
            className="h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(106,76,255,0.2)',
              color: '#6a4cff',
              boxShadow: '0 4px 12px rgba(106,76,255,0.1)',
            }}
          >
            {settings?.telegram_icon_url ? (
              <img src={settings.telegram_icon_url} alt="Telegram" className="w-5 h-5 rounded object-cover" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            Telegram Chat
          </button>

          <button 
            onClick={() => settings?.live_chat_link && window.open(settings.live_chat_link, '_blank')}
            disabled={!settings?.live_chat_link}
            className="h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(32,211,161,0.2)',
              color: '#20d3a1',
              boxShadow: '0 4px 12px rgba(32,211,161,0.1)',
            }}
          >
            {settings?.live_chat_icon_url ? (
              <img src={settings.live_chat_icon_url} alt="Live Chat" className="w-5 h-5 rounded object-cover" />
            ) : (
              <Headphones className="w-4 h-4" />
            )}
            Live Chat
          </button>
        </div>

        {/* Sign Out */}
        <button 
          onClick={handleSignOut}
          className="w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:bg-red-50 active:scale-[0.98]"
          style={{
            background: 'transparent',
            color: '#ef4444',
          }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
