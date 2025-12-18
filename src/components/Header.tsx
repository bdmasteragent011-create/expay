import { useAuth } from '@/contexts/AuthContext';
import { Shield, Wallet } from 'lucide-react';

export function Header() {
  const { agent, isAdmin } = useAuth();

  return (
    <header 
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #5b4bff, #20d3a1)',
              boxShadow: '0 8px 20px rgba(91,75,255,0.25), 0 4px 12px rgba(32,211,161,0.15)',
            }}
          >
            {/* Glossy highlight */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
              }}
            />
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 
              className="text-sm font-bold"
              style={{
                background: 'linear-gradient(to right, #6a4cff, #22d3a6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {agent?.name || 'Agent Panel'}
            </h1>
            <p className="text-xs" style={{ color: '#7a7f99' }}>{agent?.agent_id || 'Mobile Wallet'}</p>
          </div>
        </div>
        
        {agent && (
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(106,76,255,0.1)',
              border: '1px solid rgba(106,76,255,0.2)',
            }}
          >
            <Shield className="w-4 h-4" style={{ color: '#6a4cff' }} />
            <span className="text-xs font-semibold" style={{ color: '#6a4cff' }}>
              {agent.activation_code}
            </span>
          </div>
        )}

        {isAdmin && (
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(32,211,161,0.1)',
              border: '1px solid rgba(32,211,161,0.2)',
            }}
          >
            <Shield className="w-4 h-4" style={{ color: '#20d3a1' }} />
            <span className="text-xs font-semibold" style={{ color: '#20d3a1' }}>Admin</span>
          </div>
        )}
      </div>
    </header>
  );
}
