import { cn } from '@/lib/cn';

type StatusColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';

const dotColors: Record<StatusColor, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  accent: 'bg-accent-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

interface StatusDotProps {
  color?: StatusColor;
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ color = 'secondary', pulse, className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {pulse && (
        <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', dotColors[color])} />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[color])} />
    </span>
  );
}
