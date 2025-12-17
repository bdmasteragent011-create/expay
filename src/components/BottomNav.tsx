import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-2 pb-safe"
      style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 relative overflow-hidden",
                isActive && "text-white"
              )}
              style={isActive ? {
                background: 'linear-gradient(to right, #5b4bff, #20d3a1)',
                boxShadow: '0 8px 20px rgba(91,75,255,0.25), 0 4px 12px rgba(32,211,161,0.15)',
              } : {
                color: '#7a7f99',
              }}
            >
              {isActive && (
                <div 
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{
                    background: 'linear-gradient(to right, rgba(255,255,255,0.35), rgba(255,255,255,0.15), rgba(255,255,255,0.35))',
                  }}
                />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
