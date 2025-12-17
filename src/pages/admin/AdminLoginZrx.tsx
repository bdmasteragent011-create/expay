import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginZrx() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signInAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const { error } = await signInAdmin(email, password);

    if (error) {
      toast({ title: 'Login Failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome', description: 'Admin login successful' });
      navigate('/admin/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center shadow-glow mb-4">
            <Shield className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="card-3d rounded-3xl bg-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="pl-11 h-12 rounded-xl" 
                placeholder="admin@example.com"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="pl-11 pr-11 h-12 rounded-xl" 
                placeholder="••••••••"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-semibold btn-3d"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-primary">Demo Credentials</p>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@demo.com');
                  setPassword('admin123');
                }}
                className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white transition-transform hover:scale-105 active:scale-95"
              >
                Use Demo
              </button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Email:</span> admin@demo.com</p>
              <p><span className="font-medium text-foreground">Password:</span> admin123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
