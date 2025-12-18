import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCreateUser() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agent_id: '',
    district: '',
    activation_code: '',
    password: '',
  });

  const generateActivationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part1 = 'SMCT';
    const part2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setFormData((prev) => ({ ...prev, activation_code: `${part1}-${part2}-${part3}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.agent_id || !formData.activation_code || !formData.password) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          agent_id: formData.agent_id,
          district: formData.district || null,
          activation_code: formData.activation_code,
          password: formData.password,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({ title: 'Error', description: error.message || 'Failed to create user', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      toast({ title: 'Success', description: 'User created successfully' });
      sessionStorage.setItem('highlightedAgent', data.agent.id);
      navigate('/admin/users');
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create user', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Create New User</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-3d rounded-2xl bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="user@example.com"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+880..."
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Agent ID *</Label>
            <Input
              value={formData.agent_id}
              onChange={(e) => setFormData((p) => ({ ...p, agent_id: e.target.value }))}
              placeholder="AGENT001"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>District</Label>
            <Input
              value={formData.district}
              onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value }))}
              placeholder="District name"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Activation Code *</Label>
            <div className="flex gap-2">
              <Input
                value={formData.activation_code}
                onChange={(e) => setFormData((p) => ({ ...p, activation_code: e.target.value }))}
                placeholder="SMCT-XXXXXX-XXXX"
                className="h-11 rounded-xl flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateActivationCode}
                className="h-11 rounded-xl"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Password *</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              placeholder="Initial password"
              className="h-11 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-semibold"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create User'}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
}
