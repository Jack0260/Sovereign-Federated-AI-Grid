import { useState } from 'react';
import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatHash, formatDateTime } from '@/lib/format';
import { KeyRound, ShieldCheck, FileStack, CheckCircle2, XCircle, AlertTriangle, Lock } from 'lucide-react';
import type { ZKProof, LedgerEntry } from '@/types';

export function CryptoProofs() {
  const proofs = useSovereignStore((s) => s.proofs);
  const ledger = useSovereignStore((s) => s.ledger);
  const orgs = useSovereignStore((s) => s.orgs);
  const verifyProof = useSovereignStore((s) => s.verifyProof);
  const challengeProof = useSovereignStore((s) => s.challengeProof);
  const [selectedProof, setSelectedProof] = useState<ZKProof | null>(null);

  const verified = proofs.filter((p) => p.status === 'verified').length;
  const generated = proofs.filter((p) => p.status === 'generated').length;
  const challenged = proofs.filter((p) => p.status === 'challenged').length;
  const invalid = proofs.filter((p) => p.status === 'invalid').length;

  const proofColumns: Column<ZKProof>[] = [
    {
      key: 'proofHash',
      label: 'Proof Hash',
      render: (p) => <span className="font-mono text-xs text-secondary-600 dark:text-secondary-300">{formatHash(p.proofHash)}</span>,
    },
    {
      key: 'orgId',
      label: 'Organization',
      render: (p) => {
        const org = orgs.find((o) => o.id === p.orgId);
        return <span className="text-sm">{org?.name ?? p.orgId}</span>;
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (p) => <Badge color="accent">{p.type.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => {
        const colors = { generated: 'warning', verified: 'success', challenged: 'error', invalid: 'error' };
        return <Badge color={colors[p.status] as 'warning' | 'success' | 'error'} dot>{p.status}</Badge>;
      },
    },
    {
      key: 'generatedAt',
      label: 'Generated',
      sortValue: (p) => p.generatedAt,
      render: (p) => <span className="text-xs text-secondary-500">{formatDateTime(p.generatedAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1">
          {p.status === 'generated' && (
            <button
              className="btn-ghost text-xs px-2 py-1"
              onClick={(e) => { e.stopPropagation(); verifyProof(p.id); }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Verify
            </button>
          )}
          {p.status !== 'challenged' && p.status !== 'invalid' && (
            <button
              className="btn-ghost text-xs px-2 py-1 text-warning-600"
              onClick={(e) => { e.stopPropagation(); challengeProof(p.id, 'Manual audit challenge'); }}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Challenge
            </button>
          )}
          <button
            className="btn-ghost text-xs px-2 py-1"
            onClick={(e) => { e.stopPropagation(); setSelectedProof(p); }}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  const ledgerColumns: Column<LedgerEntry>[] = [
    {
      key: 'blockHash',
      label: 'Block Hash',
      render: (l) => <span className="font-mono text-xs text-secondary-600 dark:text-secondary-300">{formatHash(l.blockHash)}</span>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (l) => {
        const colors: Record<string, 'success' | 'warning' | 'error'> = {
          proof_generated: 'warning',
          proof_verified: 'success',
          proof_challenged: 'error',
          proof_invalidated: 'error',
        };
        return <Badge color={colors[l.action] ?? 'secondary'}>{l.action.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      key: 'orgId',
      label: 'Org',
      render: (l) => {
        const org = orgs.find((o) => o.id === l.orgId);
        return <span className="text-xs">{org?.name.split(' ')[0] ?? l.orgId}</span>;
      },
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortValue: (l) => l.timestamp,
      render: (l) => <span className="text-xs text-secondary-500">{formatDateTime(l.timestamp)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Proofs" value={proofs.length} icon={<KeyRound className="w-4 h-4" />} color="accent" />
        <MetricCard label="Verified" value={verified} icon={<CheckCircle2 className="w-4 h-4" />} color="success" />
        <MetricCard label="Pending" value={generated} icon={<AlertTriangle className="w-4 h-4" />} color="warning" />
        <MetricCard label="Challenged" value={challenged + invalid} icon={<XCircle className="w-4 h-4" />} color="error" />
      </div>

      {/* How it works */}
      <Card>
        <CardHeader
          title="How Zero-Knowledge Proofs Work in SOVEREIGN"
          subtitle="Mock ZK proof pipeline — hash-based commitments via Web Crypto API"
          icon={<Lock className="w-4 h-4" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { step: 1, title: 'Commit', desc: 'Org hashes gradient + salt via SHA-256. Raw data never revealed.', icon: <Lock className="w-4 h-4" />, color: 'primary' as const },
              { step: 2, title: 'Generate', desc: 'ZK proof created: commitment + nullifier + public inputs.', icon: <KeyRound className="w-4 h-4" />, color: 'accent' as const },
              { step: 3, title: 'Verify', desc: 'Coordinator verifies proof without seeing private inputs.', icon: <ShieldCheck className="w-4 h-4" />, color: 'success' as const },
              { step: 4, title: 'Ledger', desc: 'Verified proofs written to immutable hash-chain ledger.', icon: <FileStack className="w-4 h-4" />, color: 'warning' as const },
            ].map((s) => (
              <div key={s.step} className="card p-3 bg-secondary-50 dark:bg-secondary-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold">{s.step}</span>
                  <Badge color={s.color}>{s.title}</Badge>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Proof detail modal */}
      {selectedProof && (
        <Card className="border-accent-500/30">
          <CardHeader
            title="Proof Details"
            subtitle={selectedProof.id}
            icon={<KeyRound className="w-4 h-4" />}
            action={<button className="btn-ghost text-xs" onClick={() => setSelectedProof(null)}>Close</button>}
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="metric-label">Proof Hash</span>
                  <p className="font-mono text-xs text-secondary-700 dark:text-secondary-300 break-all mt-1">{selectedProof.proofHash}</p>
                </div>
                <div>
                  <span className="metric-label">Commitment</span>
                  <p className="font-mono text-xs text-secondary-700 dark:text-secondary-300 break-all mt-1">{selectedProof.commitment}</p>
                </div>
                <div>
                  <span className="metric-label">Nullifier</span>
                  <p className="font-mono text-xs text-secondary-700 dark:text-secondary-300 break-all mt-1">{selectedProof.nullifier}</p>
                </div>
                <div>
                  <span className="metric-label">Private Inputs Hash</span>
                  <p className="font-mono text-xs text-secondary-700 dark:text-secondary-300 break-all mt-1">{selectedProof.privateInputsHash}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="metric-label">Status</span>
                  <div className="mt-1"><Badge color={selectedProof.status === 'verified' ? 'success' : selectedProof.status === 'invalid' ? 'error' : 'warning'} dot>{selectedProof.status}</Badge></div>
                </div>
                <div>
                  <span className="metric-label">Public Inputs</span>
                  <pre className="font-mono text-xs text-secondary-700 dark:text-secondary-300 mt-1 p-2 rounded-lg bg-secondary-100 dark:bg-secondary-800 overflow-x-auto">{JSON.stringify(selectedProof.publicInputs, null, 2)}</pre>
                </div>
                <div>
                  <span className="metric-label">Generated At</span>
                  <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">{formatDateTime(selectedProof.generatedAt)}</p>
                </div>
                {selectedProof.verifiedAt && (
                  <div>
                    <span className="metric-label">Verified At</span>
                    <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">{formatDateTime(selectedProof.verifiedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Proofs table */}
      <Card>
        <CardHeader
          title="Zero-Knowledge Proofs"
          subtitle="All proof objects generated during training"
          icon={<KeyRound className="w-4 h-4" />}
        />
        <DataTable
          columns={proofColumns}
          data={proofs}
          rowKey={(p) => p.id}
          searchable
          searchPlaceholder="Search proofs..."
          emptyMessage="No proofs generated yet. Start a training round."
        />
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader
          title="Proof Ledger"
          subtitle="Immutable hash-chain of all proof events"
          icon={<FileStack className="w-4 h-4" />}
        />
        <DataTable
          columns={ledgerColumns}
          data={ledger}
          rowKey={(l) => l.id}
          searchable
          searchPlaceholder="Search ledger..."
          emptyMessage="No ledger entries yet."
        />
      </Card>
    </div>
  );
}
