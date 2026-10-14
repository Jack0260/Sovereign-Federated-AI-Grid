import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useSovereignStore } from '@/store/SovereignContext';
import { Overview } from '@/pages/Overview';
import { Federation } from '@/pages/Federation';
import { CryptoProofs } from '@/pages/CryptoProofs';
import { Governance } from '@/pages/Governance';
import { Marketplace } from '@/pages/Marketplace';
import { Registry } from '@/pages/Registry';
import { Economics } from '@/pages/Economics';
import { Inference } from '@/pages/Inference';
import { Compliance } from '@/pages/Compliance';
import type { PageId } from '@/lib/constants';

function App() {
  const [page, setPage] = useState<PageId>('overview');
  const loadFromDB = useSovereignStore((s) => s.loadFromDB);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  return (
    <Shell currentPage={page} onNavigate={setPage}>
      {page === 'overview' && <Overview onNavigate={setPage} />}
      {page === 'federation' && <Federation />}
      {page === 'crypto' && <CryptoProofs />}
      {page === 'governance' && <Governance />}
      {page === 'marketplace' && <Marketplace />}
      {page === 'registry' && <Registry />}
      {page === 'economics' && <Economics />}
      {page === 'inference' && <Inference />}
      {page === 'compliance' && <Compliance />}
    </Shell>
  );
}

export default App;
