import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agent_id: string;
  district: string | null;
  activation_code: string;
  available_credits: number;
  total_pay_in: number;
  total_pay_out: number;
  commission_balance: number;
  max_credit: number;
  is_banned: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  agent: Agent | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, activationCode: string) => Promise<{ error: string | null }>;
  signInAdmin: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshAgent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgent = async (userId: string) => {
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (agentData) {
      setAgent(agentData as unknown as Agent);
      setIsAdmin(false);
      // Store activation code in localStorage
      localStorage.setItem('saved_activation_code', agentData.activation_code);
    } else {
      // Check if admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (adminData) {
        setIsAdmin(true);
        setAgent(null);
      }
    }
  };

  // Subscribe to realtime agent updates
  useEffect(() => {
    if (!agent?.id) return;

    const channel = supabase
      .channel('agent-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agent.id}`,
        },
        (payload) => {
          console.log('Agent updated in realtime:', payload);
          setAgent(payload.new as unknown as Agent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchAgent(session.user.id);
          }, 0);
        } else {
          setAgent(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAgent(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, activationCode: string) => {
    // First verify activation code exists
    const { data: agentCheck } = await supabase
      .from('agents')
      .select('id, email, is_banned')
      .eq('activation_code', activationCode)
      .eq('email', email)
      .maybeSingle();

    if (!agentCheck) {
      return { error: 'Invalid credentials or activation code' };
    }

    if (agentCheck.is_banned) {
      return { error: 'Your account has been banned. Contact admin.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signInAdmin = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Verify admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', signInData.user.id)
      .maybeSingle();

    if (!adminCheck) {
      await supabase.auth.signOut();
      return { error: 'Not authorized as admin' };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAgent(null);
    setIsAdmin(false);
  };

  const refreshAgent = async () => {
    if (user) {
      await fetchAgent(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      agent, 
      isAdmin, 
      isLoading, 
      signIn, 
      signInAdmin, 
      signOut,
      refreshAgent 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
