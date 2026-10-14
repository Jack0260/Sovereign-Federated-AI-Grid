import { useState } from 'react';
import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { Tabs, useTabs } from '@/components/shared/Tabs';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatDateTime } from '@/lib/format';
import { Scale, FileText, CheckCircle2, XCircle, Clock, Shield, Gavel, Plus } from 'lucide-react';
import type { DataContract, AuditEvent, Approval } from '@/types';

export function Governance() {
  const contracts = useSovereignStore((s) => s.contracts);
  const policies = useSovereignStore((s) => s.policies);
  const auditEvents = useSovereignStore((s) => s.auditEvents);
  const approvals = useSovereignStore((s) => s.approvals);
  const orgs = useSovereignStore((s) => s.orgs);
  const approveItem = useSovereignStore((s) => s.approveItem);
  const rejectItem = useSovereignStore((s) => s.rejectItem);
  const approveContract = useSovereignStore((s) => s.approveContract);
  const { activeTab, setActiveTab } = useTabs('contracts');
  const [selectedContract, setSelectedContract] = useState<DataContract | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const activeContracts = contracts.filter((c) => c.status === 'active').length;

  const contractColumns: Column<DataContract>[] = [
    { key: 'name', label: 'Contract', sortValue: (c) => c.name, render: (c) => <span className="font-medium text-sm">{c.name}</span> },
    { key: 'regulation', label: 'Regulation', render: (c) => <Badge color="accent">{c.regulation}</Badge> },
    { key: 'category', label: 'Category', render: (c) => <span className="text-xs">{c.category.replace(/_/g, ' ')}</span> },
    { key: 'version', label: 'Version', render: (c) => <span className="font-mono text-xs">{c.version}</span> },
    { key: 'rules', label: 'Rules', sortValue: (c) => c.rules.length, render: (c) => <Badge color="secondary">{c.rules.length}</Badge> },
    { key: 'status', label: 'Status', render: (c) => <Badge color={c.status === 'active' ? 'success' : c.status === 'draft' ? 'warning' : 'secondary'} dot>{c.status}</Badge> },
    { key: 'actions', label: '', render: (c) => <button className="btn-ghost text-xs" onClick={(e) => { e.stopPropagation(); setSelectedContract(c); }}>View</button> },
  ];

  const auditColumns: Column<AuditEvent>[] = [
    { key: 'timestamp', label: 'Time', sortValue: (a) => a.timestamp, render: (a) => <span className="text-xs text-secondary-500">{formatDateTime(a.timestamp)}</span> },
    { key: 'actor', label: 'Actor', render: (a) => <span className="text-xs font-mono">{a.actor}</span> },
    { key: 'action', label: 'Action', render: (a) => <Badge color={a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'secondary'}>{a.action.replace(/_/g, ' ')}</Badge> },
    { key: 'details', label: 'Details', render: (a) => <span className="text-xs text-secondary-600 dark:text-secondary-300 truncate block max-w-md">{a.details}</span> },
    { key: 'severity', label: 'Severity', render: (a) => <Badge color={a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'success'}>{a.severity}</Badge> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Active Contracts" value={activeContracts} icon={<FileText className="w-4 h-4" />} color="primary" />
        <MetricCard label="Policies" value={policies.length} icon={<Scale className="w-4 h-4" />} color="accent" />
        <MetricCard label="Pending Approvals" value={pendingApprovals} icon={<Clock className="w-4 h-4" />} color="warning" />
        <MetricCard label="Audit Events" value={auditEvents.length} icon={<Gavel className="w-4 h-4" />} color="secondary" />
      </div>

      <Tabs
        tabs={[
          { id: 'contracts', label: 'Data Contracts', badge: contracts.length },
          { id: 'approvals', label: 'Approvals', badge: pendingApprovals },
          { id: 'audit', label: 'Audit Trail', badge: auditEvents.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'contracts' && (
        <>
          {selectedContract && (
            <Card className="border-accent-500/30">
              <CardHeader title={selectedContract.name} subtitle={`v${selectedContract.version} · ${selectedContract.regulation}`} icon={<FileText className="w-4 h-4" />} action={<button className="btn-ghost text-xs" onClick={() => setSelectedContract(null)}>Close</button>} />
              <CardBody>
                <div className="space-y-2">
                  {selectedContract.rules.map((rule) => (
                    <div key={rule.id} className="card p-3 bg-secondary-50 dark:bg-secondary-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-200">{rule.description}</span>
                        <Badge color={rule.severity === 'critical' ? 'error' : rule.severity === 'high' ? 'warning' : 'secondary'}>{rule.severity}</Badge>
                      </div>
                      <p className="text-xs font-mono text-secondary-400">{rule.field} {rule.operator} {String(rule.value)}</p>
                    </div>
                  ))}
                  {selectedContract.status === 'draft' && (
                    <button className="btn-primary w-full" onClick={() => { approveContract(selectedContract.id, 'governance-council'); setSelectedContract(null); }}>
                      <CheckCircle2 className="w-4 h-4" /> Approve Contract
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Sovereignty Contracts" subtitle="Data governance rules per organization" icon={<Shield className="w-4 h-4" />} />
            <DataTable columns={contractColumns} data={contracts} rowKey={(c) => c.id} searchable searchPlaceholder="Search contracts..." />
          </Card>
        </>
      )}

      {activeTab === 'approvals' && (
        <Card>
          <CardHeader title="Approval Queue" subtitle="Human-in-the-loop governance decisions" icon={<Clock className="w-4 h-4" />} />
          <CardBody>
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <p className="text-sm text-secondary-400 text-center py-8">No approvals pending.</p>
              ) : approvals.map((a) => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge color={a.type === 'policy_change' ? 'accent' : a.type === 'cross_border_transfer' ? 'warning' : 'secondary'}>{a.type.replace(/_/g, ' ')}</Badge>
                        <Badge color={a.status === 'pending' ? 'warning' : a.status === 'approved' ? 'success' : 'error'} dot>{a.status}</Badge>
                      </div>
                      <p className="text-sm text-secondary-700 dark:text-secondary-200">{a.description}</p>
                      <p className="text-xs text-secondary-400 mt-1">Requested by {a.requestedBy} · {formatDateTime(a.requestedAt)}</p>
                    </div>
                    {a.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="btn-primary text-xs" onClick={() => approveItem(a.id, 'governance-council')}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button className="btn-secondary text-xs" onClick={() => rejectItem(a.id, 'governance-council')}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader title="Audit Trail" subtitle="Immutable chronological log of all governance events" icon={<Gavel className="w-4 h-4" />} />
          <DataTable columns={auditColumns} data={auditEvents} rowKey={(a) => a.id} searchable searchPlaceholder="Search audit events..." maxHeight="600px" />
        </Card>
      )}
    </div>
  );
}
