import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Loader2, DollarSign, Users, UserCheck, ArrowUpRight, ArrowDownRight, CreditCard, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalDeposit: number;
  totalAgents: number;
  activeUsers: number;
}

interface Activity {
  id: string;
  type: string;
  user: string;
  amount?: number;
  time: string;
}

export default function AdminDashboardNew() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalDeposit: 0, totalAgents: 0, activeUsers: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login/zrx');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch total approved deposits
    const { data: deposits } = await supabase
      .from('deposit_requests')
      .select('amount_bdt')
      .eq('status', 'approved');

    const totalDeposit = deposits?.reduce((sum, d) => sum + Number(d.amount_bdt), 0) || 0;

    // Fetch agents count
    const { count: totalAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true });

    // Fetch active users count
    const { count: activeUsers } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', false);

    setStats({
      totalDeposit,
      totalAgents: totalAgents || 0,
      activeUsers: activeUsers || 0,
    });

    // Fetch recent activities
    const recentActivities: Activity[] = [];

    // Recent deposits
    const { data: recentDeposits } = await supabase
      .from('deposit_requests')
      .select('id, amount_bdt, status, created_at, agent_id, agents(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    recentDeposits?.forEach((d: any) => {
      recentActivities.push({
        id: d.id,
        type: d.status === 'approved' ? 'Deposit Approved' : d.status === 'rejected' ? 'Deposit Rejected' : 'Deposit Request',
        user: d.agents?.name || 'Unknown',
        amount: Number(d.amount_bdt),
        time: d.created_at,
      });
    });

    // Recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('id, type, amount, status, created_at, agent_id, agents(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    recentTransactions?.forEach((t: any) => {
      recentActivities.push({
        id: t.id,
        type: t.type === 'pay_in' ? 'Pay In' : 'Pay Out',
        user: t.agents?.name || 'Unknown',
        amount: Number(t.amount),
        time: t.created_at,
      });
    });

    // Recent messages
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('id, created_at, agent_id, agents(name)')
      .order('created_at', { ascending: false })
      .limit(3);

    recentMessages?.forEach((m: any) => {
      recentActivities.push({
        id: m.id,
        type: 'Message Sent',
        user: m.agents?.name || 'Unknown',
        time: m.created_at,
      });
    });

    // Sort by time
    recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(recentActivities.slice(0, 10));

    setIsLoading(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    if (type.includes('Deposit')) return <CreditCard className="w-4 h-4" />;
    if (type.includes('Pay In')) return <ArrowDownRight className="w-4 h-4 text-success" />;
    if (type.includes('Pay Out')) return <ArrowUpRight className="w-4 h-4 text-destructive" />;
    if (type.includes('Message')) return <MessageSquare className="w-4 h-4 text-primary" />;
    return <DollarSign className="w-4 h-4" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-3d rounded-2xl bg-card p-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">Total Deposit</p>
            <p className="text-xl font-bold">৳{stats.totalDeposit.toLocaleString()}</p>
          </div>
          
          <div className="card-3d rounded-2xl bg-card p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Total Agents</p>
            <p className="text-xl font-bold">{stats.totalAgents}</p>
          </div>
          
          <div className="card-3d rounded-2xl bg-card p-4 col-span-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Active Users</p>
            <p className="text-xl font-bold">{stats.activeUsers}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/admin/users')} 
            className="w-full card-3d rounded-xl bg-card p-4 text-left transition-transform active:scale-[0.98]"
          >
            <p className="font-semibold">Manage Users</p>
            <p className="text-sm text-muted-foreground">View, create, edit agents</p>
          </button>
          <button 
            onClick={() => navigate('/admin/settings')} 
            className="w-full card-3d rounded-xl bg-card p-4 text-left transition-transform active:scale-[0.98]"
          >
            <p className="font-semibold">Settings</p>
            <p className="text-sm text-muted-foreground">General & payment settings</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="card-3d rounded-2xl bg-card divide-y divide-border/50">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No recent activity
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.type}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="text-sm font-semibold">৳{activity.amount.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.time), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
