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
    primary: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warning',
    accent: 'gradient-accent',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "card-3d rounded-2xl bg-card p-4 cursor-pointer animate-slide-up",
        onClick && "active:scale-95",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          variantStyles[variant]
        )}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">৳{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}
