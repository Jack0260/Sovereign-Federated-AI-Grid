import { useState } from 'react';
import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatDateTime, formatHash } from '@/lib/format';
import { GitBranch, CheckCircle2, PenTool, Rocket, Archive, FileText } from 'lucide-react';
import type { ModelVersion } from '@/types';

export function Registry() {
  const models = useSovereignStore((s) => s.models);
  const orgs = useSovereignStore((s) => s.orgs);
  const signModel = useSovereignStore((s) => s.signModel);
  const deployModel = useSovereignStore((s) => s.deployModel);
  const [selected, setSelected] = useState<ModelVersion | null>(null);

  const deployed = models.filter((m) => m.status === 'deployed').length;
  const trained = models.filter((m) => m.status === 'trained').length;
  const signed = models.filter((m) => m.signature).length;

  const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
    deployed: 'success', trained: 'primary', training: 'warning', archived: 'secondary', deprecated: 'error',
  };

  const columns: Column<ModelVersion>[] = [
    { key: 'version', label: 'Version', sortValue: (m) => m.version, render: (m) => <span className="font-mono text-sm font-semibold">v{m.version}</span> },
    { key: 'name', label: 'Name', render: (m) => <span className="text-sm">{m.name}</span> },
    { key: 'status', label: 'Status', render: (m) => <Badge color={statusColors[m.status]} dot>{m.status}</Badge> },
    { key: 'accuracy', label: 'Accuracy', sortValue: (m) => m.metrics.accuracy, render: (m) => <span className="font-mono text-sm">{(m.metrics.accuracy * 100).toFixed(1)}%</span> },
    { key: 'loss', label: 'Loss', sortValue: (m) => m.metrics.loss, render: (m) => <span className="font-mono text-sm">{m.metrics.loss.toFixed(4)}</span> },
    { key: 'signature', label: 'Signed', render: (m) => m.signature ? <Badge color="success"><CheckCircle2 className="w-3 h-3" /> Yes</Badge> : <Badge color="warning">No</Badge> },
    { key: 'createdAt', label: 'Created', sortValue: (m) => m.createdAt, render: (m) => <span className="text-xs text-secondary-500">{formatDateTime(m.createdAt)}</span> },
    { key: 'actions', label: '', render: (m) => <button className="btn-ghost text-xs" onClick={(e) => { e.stopPropagation(); setSelected(m); }}>Details</button> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Versions" value={models.length} icon={<GitBranch className="w-4 h-4" />} color="accent" />
        <MetricCard label="Deployed" value={deployed} icon={<Rocket className="w-4 h-4" />} color="success" />
        <MetricCard label="Trained" value={trained} icon={<CheckCircle2 className="w-4 h-4" />} color="primary" />
        <MetricCard label="Signed" value={signed} icon={<PenTool className="w-4 h-4" />} color="warning" />
      </div>

      {selected && (
        <Card className="border-accent-500/30">
          <CardHeader title={`${selected.name} v${selected.version}`} subtitle={selected.description} icon={<FileText className="w-4 h-4" />} action={<button className="btn-ghost text-xs" onClick={() => setSelected(null)}>Close</button>} />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div><span className="metric-label">Weights Hash</span><p className="font-mono text-xs text-secondary-600 dark:text-secondary-300 mt-1 break-all">{selected.weightsHash}</p></div>
                {selected.signature && <div><span className="metric-label">Signature</span><p className="font-mono text-xs text-secondary-600 dark:text-secondary-300 mt-1 break-all">{formatHash(selected.signature, 20)}</p></div>}
                <div><span className="metric-label">Signed By</span><p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">{selected.signedBy || 'Unsigned'}</p></div>
                <div><span className="metric-label">Size</span><p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">{selected.size.toFixed(1)} MB</p></div>
                <div><span className="metric-label">Parent Version</span><p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">{selected.parentVersionId ? models.find(m => m.id === selected.parentVersionId)?.version : 'Root (base model)'}</p></div>
              </div>
              <div className="space-y-3">
                <div><span className="metric-label">Metrics</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="card p-2 bg-secondary-50 dark:bg-secondary-800/50"><span className="text-xs text-secondary-400">Accuracy</span><p className="font-mono text-sm font-semibold">{(selected.metrics.accuracy * 100).toFixed(1)}%</p></div>
                    <div className="card p-2 bg-secondary-50 dark:bg-secondary-800/50"><span className="text-xs text-secondary-400">Loss</span><p className="font-mono text-sm font-semibold">{selected.metrics.loss.toFixed(4)}</p></div>
                    <div className="card p-2 bg-secondary-50 dark:bg-secondary-800/50"><span className="text-xs text-secondary-400">F1 Score</span><p className="font-mono text-sm font-semibold">{(selected.metrics.f1Score * 100).toFixed(1)}%</p></div>
                    <div className="card p-2 bg-secondary-50 dark:bg-secondary-800/50"><span className="text-xs text-secondary-400">Precision</span><p className="font-mono text-sm font-semibold">{(selected.metrics.precision * 100).toFixed(1)}%</p></div>
                  </div>
                </div>
                <div><span className="metric-label">Org Contributions</span>
                  <div className="space-y-1 mt-1">
                    {Object.entries(selected.orgContributions).map(([orgId, pct]) => {
                      const org = orgs.find(o => o.id === orgId);
                      return (
                        <div key={orgId} className="flex items-center justify-between text-xs">
                          <span className="text-secondary-500">{org?.name ?? orgId}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-secondary-200 dark:bg-secondary-700 overflow-hidden">
                              <div className="h-full bg-primary-500" style={{ width: `${pct * 100}%` }} />
                            </div>
                            <span className="font-mono text-secondary-600 dark:text-secondary-300">{(pct * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(selected.orgContributions).length === 0 && <p className="text-xs text-secondary-400">Base model — no contributions</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!selected.signature && selected.status !== 'archived' && (
                    <button className="btn-primary text-xs" onClick={() => signModel(selected.id, 'governance-council', 'org-a')}><PenTool className="w-3.5 h-3.5" /> Sign Model</button>
                  )}
                  {selected.signature && selected.status === 'trained' && (
                    <button className="btn-primary text-xs" onClick={() => { deployModel(selected.id); setSelected(null); }}><Rocket className="w-3.5 h-3.5" /> Deploy</button>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Lineage */}
      <Card>
        <CardHeader title="Model Lineage" subtitle="Version ancestry and training history" icon={<GitBranch className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-2">
            {models.map((m, i) => {
              const parent = m.parentVersionId ? models.find(p => p.id === m.parentVersionId) : null;
              return (
                <div key={m.id} className="flex items-center gap-3">
                  {i < models.length - 1 && <div className="w-px h-full absolute ml-4 bg-secondary-200 dark:bg-secondary-700" style={{ top: '100%', height: '40px' }} />}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${m.status === 'deployed' ? 'bg-success-500/10 text-success-500' : m.status === 'trained' ? 'bg-primary-500/10 text-primary-500' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-400'}`}>
                    {m.status === 'deployed' ? <Rocket className="w-4 h-4" /> : m.status === 'archived' ? <Archive className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">v{m.version}</span>
                      <Badge color={statusColors[m.status]}>{m.status}</Badge>
                      {m.signature && <Badge color="success"><CheckCircle2 className="w-3 h-3" /> Signed</Badge>}
                    </div>
                    <p className="text-xs text-secondary-400 truncate">{m.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-secondary-600 dark:text-secondary-300">{(m.metrics.accuracy * 100).toFixed(1)}%</p>
                    <p className="text-xs text-secondary-400">{formatDateTime(m.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Model Versions" subtitle="All registered model versions" icon={<FileText className="w-4 h-4" />} />
        <DataTable columns={columns} data={models} rowKey={(m) => m.id} searchable searchPlaceholder="Search models..." />
      </Card>
    </div>
  );
}
