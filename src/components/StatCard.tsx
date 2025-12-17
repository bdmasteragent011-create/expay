import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'accent';
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, variant = 'primary', onClick, className }: StatCardProps) {
  const variantStyles = {
    primary: {
      gradient: 'linear-gradient(135deg, #5b4bff, #8a63ff)',
      shadow: '0 8px 20px rgba(91,75,255,0.25)',
    },
    success: {
      gradient: 'linear-gradient(135deg, #20d3a1, #5ee6c5)',
      shadow: '0 8px 20px rgba(32,211,161,0.25)',
    },
    warning: {
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      shadow: '0 8px 20px rgba(245,158,11,0.25)',
    },
    accent: {
      gradient: 'linear-gradient(135deg, #8a63ff, #c7b8ff)',
      shadow: '0 8px 20px rgba(138,99,255,0.25)',
    },
  };

  const style = variantStyles[variant];

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl p-4 cursor-pointer animate-slide-up transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        onClick && "active:scale-95",
        className
      )}
      style={{
        background: '#ffffff',
        boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
          style={{
            background: style.gradient,
            boxShadow: style.shadow,
          }}
        >
          {/* Glossy highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
            }}
          />
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-xs mb-1" style={{ color: '#7a7f99' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: '#1a1a2e' }}>
        ৳{typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
