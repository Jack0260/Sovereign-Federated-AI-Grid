import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NAV_ITEMS, type PageId } from '@/lib/constants';
import { useSovereignStore } from '@/store/SovereignContext';

interface ShellProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function Shell({ currentPage, onNavigate, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useSovereignStore((s) => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navItem = NAV_ITEMS.find((n) => n.id === currentPage);

  return (
    <div className="flex min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          onMobileMenuOpen={() => setMobileOpen(true)}
          title={navItem?.label ?? ''}
          subtitle={navItem ? PAGE_SUBTITLES[navItem.id] : undefined}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const PAGE_SUBTITLES: Record<PageId, string> = {
  overview: 'System-wide status across all subsystems',
  federation: 'Federated training rounds, enclaves, and gradient flow',
  crypto: 'Zero-knowledge proof generation, verification, and ledger',
  governance: 'Data contracts, policy management, approvals, and audit',
  marketplace: 'Compute buy/sell with carbon-aware scheduling',
  registry: 'Versioned, signed models with lineage tracking',
  economics: 'Cost, carbon, and compute token metering per organization',
  inference: 'On-premises edge inference simulation',
  compliance: 'Regulatory compliance, cross-border transfers, and audit artifacts',
};
