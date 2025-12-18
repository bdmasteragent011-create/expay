import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Plus, Trash2, Settings2, CreditCard, Shield, ChevronRight, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Settings {
  id: string;
  site_title: string | null;
  telegram_link: string | null;
  live_chat_link: string | null;
  telegram_icon_url: string | null;
  live_chat_icon_url: string | null;
  maintenance_mode: boolean | null;
  dollar_rate: number | null;
}

interface DepositMethod {
  id: string;
  name: string;
  number: string | null;
  instructions: string | null;
  is_active: boolean | null;
  image_url: string | null;
}

export default function AdminSettings() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'payment'>('general');
  const [saving, setSaving] = useState<string | null>(null);

  // General settings
  const [settings, setSettings] = useState<Settings | null>(null);
  const [generalForm, setGeneralForm] = useState({
    site_title: '',
    telegram_link: '',
    live_chat_link: '',
    telegram_icon_url: '',
    live_chat_icon_url: '',
    maintenance_mode: false,
  });

  // Payment settings
  const [dollarRate, setDollarRate] = useState('');
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [newMethod, setNewMethod] = useState({ name: '', number: '', instructions: '', image_url: '' });
  const [editingMethod, setEditingMethod] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login/zrx');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    setIsLoading(true);

    // Fetch settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settingsData) {
      setSettings(settingsData as Settings);
      setGeneralForm({
        site_title: settingsData.site_title || '',
        telegram_link: settingsData.telegram_link || '',
        live_chat_link: settingsData.live_chat_link || '',
        telegram_icon_url: (settingsData as any).telegram_icon_url || '',
        live_chat_icon_url: (settingsData as any).live_chat_icon_url || '',
        maintenance_mode: settingsData.maintenance_mode || false,
      });
      setDollarRate(String(settingsData.dollar_rate || 125));
    }

    // Fetch deposit methods
    const { data: methodsData } = await supabase
      .from('deposit_methods')
      .select('*')
      .order('created_at', { ascending: true });

    setMethods(methodsData || []);
    setIsLoading(false);
  };

  const handleSaveGeneral = async () => {
    setSaving('general');

    if (settings) {
      const { error } = await supabase
        .from('settings')
        .update({
          site_title: generalForm.site_title,
          telegram_link: generalForm.telegram_link,
          live_chat_link: generalForm.live_chat_link,
          telegram_icon_url: generalForm.telegram_icon_url || null,
          live_chat_icon_url: generalForm.live_chat_icon_url || null,
          maintenance_mode: generalForm.maintenance_mode,
        } as any)
        .eq('id', settings.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Settings saved' });
      }
    } else {
      // Create settings if not exists
      const { error } = await supabase.from('settings').insert({
        site_title: generalForm.site_title,
        telegram_link: generalForm.telegram_link,
        live_chat_link: generalForm.live_chat_link,
        telegram_icon_url: generalForm.telegram_icon_url || null,
        live_chat_icon_url: generalForm.live_chat_icon_url || null,
        maintenance_mode: generalForm.maintenance_mode,
        dollar_rate: 125,
      } as any);

      if (error) {
        toast({ title: 'Error', description: 'Failed to create settings', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Settings created' });
        fetchSettings();
      }
    }

    setSaving(null);
  };

  const handleSaveRate = async () => {
    if (!settings) return;
    setSaving('rate');

    const { error } = await supabase
      .from('settings')
      .update({ dollar_rate: Number(dollarRate) })
      .eq('id', settings.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save rate', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Dollar rate updated' });
    }

    setSaving(null);
  };

  const handleAddMethod = async () => {
    if (!newMethod.name) return;
    setSaving('add-method');

    const { error } = await supabase.from('deposit_methods').insert({
      name: newMethod.name,
      number: newMethod.number || null,
      instructions: newMethod.instructions || null,
      image_url: newMethod.image_url || null,
      is_active: true,
    } as any);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add method', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Method added' });
      setNewMethod({ name: '', number: '', instructions: '', image_url: '' });
      fetchSettings();
    }

    setSaving(null);
  };

  const handleUpdateMethod = async (method: DepositMethod) => {
    setSaving(`update-${method.id}`);

    const { error } = await supabase
      .from('deposit_methods')
      .update({
        name: method.name,
        number: method.number,
        instructions: method.instructions,
        image_url: method.image_url,
      } as any)
      .eq('id', method.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update method', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Method updated' });
      setEditingMethod(null);
    }

    setSaving(null);
  };

  const handleToggleMethod = async (method: DepositMethod) => {
    const { error } = await supabase
      .from('deposit_methods')
      .update({ is_active: !method.is_active })
      .eq('id', method.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to toggle method', variant: 'destructive' });
    } else {
      fetchSettings();
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    const { error } = await supabase.from('deposit_methods').delete().eq('id', methodId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete method', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Method deleted' });
      fetchSettings();
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
        <h2 className="text-xl font-bold">Settings</h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'general'
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Settings2 className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'payment'
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Payment
          </button>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="card-3d rounded-2xl bg-card p-4 space-y-4">
            <div className="space-y-2">
              <Label>Site Title</Label>
              <Input
                value={generalForm.site_title}
                onChange={(e) => setGeneralForm(p => ({ ...p, site_title: e.target.value }))}
                placeholder="Agent Panel"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Telegram Support Link</Label>
              <Input
                value={generalForm.telegram_link}
                onChange={(e) => setGeneralForm(p => ({ ...p, telegram_link: e.target.value }))}
                placeholder="https://t.me/..."
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Telegram Icon URL</Label>
              <Input
                value={generalForm.telegram_icon_url}
                onChange={(e) => setGeneralForm(p => ({ ...p, telegram_icon_url: e.target.value }))}
                placeholder="https://example.com/telegram-icon.png"
                className="h-11 rounded-xl"
              />
              {generalForm.telegram_icon_url && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <img src={generalForm.telegram_icon_url} alt="Telegram Icon" className="w-8 h-8 rounded object-cover" />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Live Chat Link</Label>
              <Input
                value={generalForm.live_chat_link}
                onChange={(e) => setGeneralForm(p => ({ ...p, live_chat_link: e.target.value }))}
                placeholder="https://..."
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Live Chat Icon URL</Label>
              <Input
                value={generalForm.live_chat_icon_url}
                onChange={(e) => setGeneralForm(p => ({ ...p, live_chat_icon_url: e.target.value }))}
                placeholder="https://example.com/livechat-icon.png"
                className="h-11 rounded-xl"
              />
              {generalForm.live_chat_icon_url && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <img src={generalForm.live_chat_icon_url} alt="Live Chat Icon" className="w-8 h-8 rounded object-cover" />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Block user access</p>
              </div>
              <Switch
                checked={generalForm.maintenance_mode}
                onCheckedChange={(checked) => setGeneralForm(p => ({ ...p, maintenance_mode: checked }))}
              />
            </div>

            {/* Manage Admins Link */}
            <button
              onClick={() => navigate('/admin/manage-admins')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Manage Admin Users</p>
                  <p className="text-xs text-muted-foreground">Add or remove administrators</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <Button
              onClick={handleSaveGeneral}
              disabled={saving === 'general'}
              className="w-full h-11 rounded-xl gradient-accent text-accent-foreground"
            >
              {saving === 'general' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save General Settings
                </>
              )}
            </Button>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            {/* Dollar Rate */}
            <div className="card-3d rounded-2xl bg-card p-4 space-y-3">
              <h3 className="font-semibold text-primary">Dollar Rate</h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={dollarRate}
                  onChange={(e) => setDollarRate(e.target.value)}
                  placeholder="125"
                  className="h-11 rounded-xl flex-1"
                />
                <Button
                  onClick={handleSaveRate}
                  disabled={saving === 'rate'}
                  className="h-11 rounded-xl"
                >
                  {saving === 'rate' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">1 USD = ৳{dollarRate}</p>
            </div>

            {/* Deposit Methods */}
            <div className="card-3d rounded-2xl bg-card p-4 space-y-4">
              <h3 className="font-semibold text-primary">Deposit Methods</h3>

              {/* Add New Method */}
              <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                <p className="text-sm font-medium">Add New Method</p>
                <Input
                  value={newMethod.name}
                  onChange={(e) => setNewMethod(p => ({ ...p, name: e.target.value }))}
                  placeholder="Method name (e.g., Bkash)"
                  className="h-10 rounded-xl"
                />
                <Input
                  value={newMethod.number}
                  onChange={(e) => setNewMethod(p => ({ ...p, number: e.target.value }))}
                  placeholder="Account number"
                  className="h-10 rounded-xl"
                />
                <Input
                  value={newMethod.image_url}
                  onChange={(e) => setNewMethod(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="Logo URL (e.g., https://...)"
                  className="h-10 rounded-xl"
                />
                {newMethod.image_url && (
                  <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                    <img src={newMethod.image_url} alt="Method Logo" className="w-10 h-10 rounded object-cover" />
                    <span className="text-xs text-muted-foreground">Logo Preview</span>
                  </div>
                )}
                <Textarea
                  value={newMethod.instructions}
                  onChange={(e) => setNewMethod(p => ({ ...p, instructions: e.target.value }))}
                  placeholder="Instructions..."
                  className="rounded-xl min-h-[60px]"
                />
                <Button
                  onClick={handleAddMethod}
                  disabled={saving === 'add-method'}
                  className="w-full h-10 rounded-xl"
                >
                  {saving === 'add-method' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Method</>}
                </Button>
              </div>

              {/* Methods List */}
              {methods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deposit methods</p>
              ) : (
                <div className="space-y-3">
                  {methods.map((method) => (
                    <div key={method.id} className="p-3 rounded-xl bg-muted/30 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingMethod === method.id ? (
                            <div className="space-y-2">
                              <Input
                                value={method.name}
                                onChange={(e) => setMethods(m => m.map(x => x.id === method.id ? { ...x, name: e.target.value } : x))}
                                className="h-9 rounded-lg"
                              />
                              <Input
                                value={method.number || ''}
                                onChange={(e) => setMethods(m => m.map(x => x.id === method.id ? { ...x, number: e.target.value } : x))}
                                placeholder="Account number"
                                className="h-9 rounded-lg"
                              />
                              <Input
                                value={method.image_url || ''}
                                onChange={(e) => setMethods(m => m.map(x => x.id === method.id ? { ...x, image_url: e.target.value } : x))}
                                placeholder="Logo URL"
                                className="h-9 rounded-lg"
                              />
                              {method.image_url && (
                                <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                                  <img src={method.image_url} alt="Method Logo" className="w-8 h-8 rounded object-cover" />
                                  <span className="text-xs text-muted-foreground">Logo Preview</span>
                                </div>
                              )}
                              <Textarea
                                value={method.instructions || ''}
                                onChange={(e) => setMethods(m => m.map(x => x.id === method.id ? { ...x, instructions: e.target.value } : x))}
                                placeholder="Instructions"
                                className="rounded-lg min-h-[50px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleUpdateMethod(method)}
                                  disabled={saving === `update-${method.id}`}
                                  size="sm"
                                  className="h-8 rounded-lg"
                                >
                                  {saving === `update-${method.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingMethod(null);
                                    fetchSettings();
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-lg"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {method.image_url && (
                                <img src={method.image_url} alt={method.name} className="w-10 h-10 rounded-lg object-cover" />
                              )}
                              <div>
                                <p className="font-medium">{method.name}</p>
                                {method.number && <p className="text-sm text-muted-foreground">{method.number}</p>}
                                {method.instructions && <p className="text-xs text-muted-foreground mt-1">{method.instructions}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                        {editingMethod !== method.id && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={method.is_active || false}
                              onCheckedChange={() => handleToggleMethod(method)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingMethod(method.id)}
                              className="h-8 w-8"
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteMethod(method.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
