import { cn } from '@/lib/cn';

type BadgeColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';

const colorClasses: Record<BadgeColor, string> = {
  primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
  secondary: 'bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 border-secondary-500/20',
  accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-400 border-accent-500/20',
  success: 'bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20',
  error: 'bg-error-500/10 text-error-600 dark:text-error-400 border-error-500/20',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, color = 'secondary', className, dot }: BadgeProps) {
  return (
    <span className={cn('badge-base border', colorClasses[color], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  );
}
