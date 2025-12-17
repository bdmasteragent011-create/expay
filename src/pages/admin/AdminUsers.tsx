import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Edit, Ban, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  email: string;
  agent_id: string;
  is_banned: boolean;
  activation_code: string;
}

export default function AdminUsers() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login/zrx');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAgents();
      // Check for highlighted user from create
      const highlighted = sessionStorage.getItem('highlightedAgent');
      if (highlighted) {
        setHighlightedId(highlighted);
        sessionStorage.removeItem('highlightedAgent');
        setTimeout(() => setHighlightedId(null), 3000);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    filterAgents();
  }, [agents, search, filter]);

  const fetchAgents = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('agents')
      .select('id, name, email, agent_id, is_banned, activation_code')
      .order('created_at', { ascending: false });

    setAgents(data || []);
    setIsLoading(false);
  };

  const filterAgents = () => {
    let filtered = [...agents];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchLower) ||
          a.email.toLowerCase().includes(searchLower) ||
          a.agent_id.toLowerCase().includes(searchLower) ||
          a.activation_code.toLowerCase().includes(searchLower)
      );
    }

    if (filter === 'active') {
      filtered = filtered.filter((a) => !a.is_banned);
    } else if (filter === 'banned') {
      filtered = filtered.filter((a) => a.is_banned);
    }

    setFilteredAgents(filtered);
  };

  const handleBanToggle = async (agent: Agent) => {
    const newStatus = !agent.is_banned;
    const { error } = await supabase
      .from('agents')
      .update({ is_banned: newStatus })
      .eq('id', agent.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ 
        title: 'Success', 
        description: `User ${newStatus ? 'banned' : 'unbanned'} successfully` 
      });
      fetchAgents();
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Users</h2>
          <Button 
            onClick={() => navigate('/admin/users/create')}
            className="rounded-xl gradient-accent text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ID..."
              className="pl-11 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'banned'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filteredAgents.length === 0 ? (
            <div className="card-3d rounded-2xl bg-card p-8 text-center">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "card-3d rounded-2xl bg-card p-4 transition-all",
                  highlightedId === agent.id && "ring-2 ring-primary animate-pulse"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">ID: {agent.agent_id}</p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      agent.is_banned
                        ? "bg-destructive/10 text-destructive"
                        : "bg-success/10 text-success"
                    )}
                  >
                    {agent.is_banned ? 'Banned' : 'Active'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/users/${agent.id}`)}
                    className="flex-1 rounded-xl"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant={agent.is_banned ? "default" : "destructive"}
                    size="sm"
                    onClick={() => handleBanToggle(agent)}
                    className="flex-1 rounded-xl"
                  >
                    {agent.is_banned ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unban
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Ban
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
