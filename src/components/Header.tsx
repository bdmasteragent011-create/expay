import { useAuth } from '@/contexts/AuthContext';
import { Shield, Wallet } from 'lucide-react';

export function Header() {
  const { agent, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Agent Panel</h1>
            <p className="text-xs text-muted-foreground">Mobile Wallet</p>
          </div>
        </div>
        
        {agent && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">{agent.activation_code}</span>
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent">Admin</span>
          </div>
        )}
      </div>
    </header>
  );
}
