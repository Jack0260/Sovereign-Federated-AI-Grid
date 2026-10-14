import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive?: boolean };
  color?: 'primary' | 'accent' | 'warning' | 'error' | 'success' | 'secondary';
  className?: string;
}

const iconBgColors: Record<string, string> = {
  primary: 'bg-primary-500/10 text-primary-500',
  accent: 'bg-accent-500/10 text-accent-500',
  warning: 'bg-warning-500/10 text-warning-500',
  error: 'bg-error-500/10 text-error-500',
  success: 'bg-success-500/10 text-success-500',
  secondary: 'bg-secondary-500/10 text-secondary-500',
};

export function MetricCard({ label, value, unit, icon, trend, color = 'primary', className }: MetricCardProps) {
  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="metric-label">{label}</span>
        {icon && (
          <span className={cn('flex items-center justify-center w-8 h-8 rounded-lg', iconBgColors[color])}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="metric-value text-secondary-900 dark:text-secondary-50">{value}</span>
        {unit && <span className="text-sm text-secondary-500 dark:text-secondary-400">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend.positive ? (
            <TrendingUp className="w-3.5 h-3.5 text-success-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-error-500" />
          )}
          <span className={cn('text-xs font-medium', trend.positive ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400')}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
