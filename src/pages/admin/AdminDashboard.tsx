import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, DollarSign, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/admin');
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen pb-6">
      <header className="glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
        <button onClick={() => { signOut(); navigate('/admin'); }} className="text-sm text-destructive">Logout</button>
      </header>

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card-3d rounded-2xl bg-card p-4"><DollarSign className="w-8 h-8 text-success mb-2" /><p className="text-xs text-muted-foreground">Total Deposits</p><p className="text-xl font-bold">৳0</p></div>
          <div className="card-3d rounded-2xl bg-card p-4"><Users className="w-8 h-8 text-primary mb-2" /><p className="text-xs text-muted-foreground">Total Agents</p><p className="text-xl font-bold">0</p></div>
          <div className="card-3d rounded-2xl bg-card p-4"><UserCheck className="w-8 h-8 text-accent mb-2" /><p className="text-xs text-muted-foreground">Active Users</p><p className="text-xl font-bold">0</p></div>
        </div>

        <div className="space-y-2">
          <button onClick={() => navigate('/admin/users')} className="w-full card-3d rounded-xl bg-card p-4 text-left"><p className="font-semibold">Manage Users</p><p className="text-sm text-muted-foreground">View, create, edit agents</p></button>
          <button onClick={() => navigate('/admin/settings')} className="w-full card-3d rounded-xl bg-card p-4 text-left"><p className="font-semibold">Settings</p><p className="text-sm text-muted-foreground">General & payment settings</p></button>
        </div>
      </main>
    </div>
  );
}
