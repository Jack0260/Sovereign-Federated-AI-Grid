import { cn } from '@/lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      className={cn('card', hover && 'card-hover', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-4 border-b border-secondary-200 dark:border-secondary-800', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="text-secondary-400 shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
