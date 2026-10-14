import { useState } from 'react';
import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-secondary-200 dark:border-secondary-800', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-all',
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
          )}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={cn(
              'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold',
              activeTab === tab.id
                ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
                : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400'
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function useTabs(initialTab: string) {
  const [activeTab, setActiveTab] = useState(initialTab);
  return { activeTab, setActiveTab };
}
