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

  // Subscribe to realtime agent updates and auto-logout on ban or delete
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
        async (payload) => {
          console.log('Agent updated in realtime:', payload);
          const updatedAgent = payload.new as unknown as Agent & { is_deleted?: boolean };
          
          // If user gets banned while logged in, sign them out immediately
          if (updatedAgent.is_banned && !agent.is_banned) {
            await supabase.auth.signOut();
            setAgent(null);
            setIsAdmin(false);
            return;
          }
          
          // If user gets deleted while logged in, sign them out immediately
          if (updatedAgent.is_deleted) {
            await supabase.auth.signOut();
            setAgent(null);
            setIsAdmin(false);
            return;
          }
          
          setAgent(updatedAgent as unknown as Agent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id, agent?.is_banned]);

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

  const normalizeActivationCode = (code: string) => code.trim().toUpperCase();

  const signIn = async (email: string, password: string, activationCode: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = normalizeActivationCode(activationCode);

    if (!normalizedEmail || !password || !normalizedCode) {
      return { error: 'Please enter email, password, and activation code' };
    }

    // 1) Authenticate first (agents table is protected by RLS until the user is logged in)
    const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return { error: 'Incorrect email or password' };
      }
      return { error: authError.message };
    }

    const userId = signInData.user.id;

    // 2) Load agent profile and validate activation code AFTER login
    const { data: agentRow, error: agentRowError } = await supabase
      .from('agents')
      .select('activation_code, is_banned, is_deleted')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (agentRowError || !agentRow) {
      await supabase.auth.signOut();
      return { error: 'Account not properly set up. Contact admin.' };
    }

    // Check if account is deleted
    if (agentRow.is_deleted) {
      await supabase.auth.signOut();
      return { error: 'Your account has been deleted. Contact admin.' };
    }

    // Check if account is banned
    if (agentRow.is_banned) {
      await supabase.auth.signOut();
      return { error: 'Your account has been banned. Contact admin.' };
    }

    if (normalizeActivationCode(agentRow.activation_code) !== normalizedCode) {
      await supabase.auth.signOut();
      return { error: 'Invalid activation code for this account' };
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
