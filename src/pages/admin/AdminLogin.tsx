import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signInAdmin(email, password);

    if (error) {
      toast({ title: 'Login Failed', description: error, variant: 'destructive' });
    } else {
      navigate('/admin/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center shadow-glow mb-4">
            <Shield className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>

        <form onSubmit={handleSubmit} className="card-3d rounded-3xl bg-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 rounded-xl" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 h-12 rounded-xl" required />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-semibold btn-3d">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>

          {/* Demo Credentials */}
          <div 
            className="mt-6 p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(106,76,255,0.08), rgba(34,211,166,0.08))',
              borderRadius: '12px',
              border: '1px solid rgba(106,76,255,0.15)',
            }}
          >
            <p 
              className="text-xs font-semibold mb-2 text-center"
              style={{ color: '#6a4cff' }}
            >
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs" style={{ color: '#7a7f99' }}>
              <p><span className="font-medium" style={{ color: '#1a1a2e' }}>Email:</span> admin@demo.com</p>
              <p><span className="font-medium" style={{ color: '#1a1a2e' }}>Password:</span> admin123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
