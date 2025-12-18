import { useState, forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LayoutDashboard, Users, Settings, LogOut, Shield, Sparkles, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = forwardRef<HTMLDivElement, AdminLayoutProps>(({ children }, ref) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login/zrx');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: CreditCard, label: 'Deposits', path: '/admin/deposits' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div ref={ref} className="min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 -z-10" />
      
      {/* Decorative Blobs */}
      <div 
        className="blob-decoration w-[500px] h-[500px] -top-[200px] -left-[200px]"
        style={{ background: 'hsl(168 76% 42% / 0.15)' }}
      />
      <div 
        className="blob-decoration w-[400px] h-[400px] top-[30%] -right-[150px]"
        style={{ background: 'hsl(251 91% 60% / 0.1)' }}
      />
      <div 
        className="blob-decoration w-[350px] h-[350px] -bottom-[100px] left-[20%]"
        style={{ background: 'hsl(45 93% 47% / 0.08)' }}
      />

      {/* Admin Header */}
      <header className="sticky top-0 z-40 glass-card px-4 py-3">
        <div className="flex items-center justify-between max-w-[480px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all duration-300 group"
            >
              <Menu className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
                <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
              </div>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          
          {/* Premium Admin Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Admin</span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 glass-card shadow-xl animate-slide-in-right overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Admin Menu</h2>
                    <p className="text-xs text-muted-foreground">Manage your system</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300",
                    "animate-slide-up",
                    location.pathname === item.path
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                      : "hover:bg-muted/50 hover:translate-x-1"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    location.pathname === item.path
                      ? "bg-primary-foreground/20"
                      : "bg-primary/10"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5",
                      location.pathname === item.path ? "text-primary-foreground" : "text-primary"
                    )} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                  )}
                </button>
              ))}
              
              {/* Divider */}
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: '200ms' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
            </nav>
            
            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Administrator</p>
                  <p className="text-xs text-muted-foreground">Full Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 pb-8 max-w-[480px] mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
});

AdminLayout.displayName = 'AdminLayout';

export default AdminLayout;