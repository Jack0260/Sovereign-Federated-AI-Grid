import { useState } from 'react';
import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatDateTime } from '@/lib/format';
import { REGULATION_INFO } from '@/lib/constants';
import { FileCheck, Shield, Globe2, FileText, Send, CheckCircle2, XCircle, AlertTriangle, FileStack } from 'lucide-react';
import type { ComplianceArtifact, CrossBorderTransfer } from '@/types';

export function Compliance() {
  const orgs = useSovereignStore((s) => s.orgs);
  const regulationRules = useSovereignStore((s) => s.regulationRules);
  const complianceArtifacts = useSovereignStore((s) => s.complianceArtifacts);
  const crossBorderTransfers = useSovereignStore((s) => s.crossBorderTransfers);
  const generateComplianceArtifact = useSovereignStore((s) => s.generateComplianceArtifact);
  const requestCrossBorderTransfer = useSovereignStore((s) => s.requestCrossBorderTransfer);

  const [fromOrg, setFromOrg] = useState(orgs[0]?.id ?? '');
  const [toOrg, setToOrg] = useState(orgs[1]?.id ?? '');

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
    compliant: 'success', warning: 'warning', non_compliant: 'error', pending_review: 'secondary',
  };

  // Compliance matrix
  const matrix = orgs.map((org) => {
    const rules = regulationRules.filter((r) => r.regulation === org.regulation);
    const artifacts = complianceArtifacts.filter((a) => a.orgId === org.id);
    const status: string = artifacts.length > 0 ? 'compliant' : 'pending_review';
    return { org, rules, artifacts: artifacts.length, status };
  });

  const artifactColumns: Column<ComplianceArtifact>[] = [
    { key: 'title', label: 'Artifact', sortValue: (a) => a.title, render: (a) => <span className="text-sm font-medium">{a.title}</span> },
    { key: 'orgId', label: 'Organization', render: (a) => { const org = orgs.find(o => o.id === a.orgId); return <span className="text-sm">{org?.name ?? a.orgId}</span>; } },
    { key: 'regulation', label: 'Regulation', render: (a) => <Badge color="accent">{a.regulation}</Badge> },
    { key: 'type', label: 'Type', render: (a) => <span className="text-xs">{a.type.replace(/_/g, ' ')}</span> },
    { key: 'verified', label: 'Verified', render: (a) => a.verified ? <Badge color="success"><CheckCircle2 className="w-3 h-3" /> Verified</Badge> : <Badge color="warning">Pending</Badge> },
    { key: 'generatedAt', label: 'Generated', sortValue: (a) => a.generatedAt, render: (a) => <span className="text-xs text-secondary-500">{formatDateTime(a.generatedAt)}</span> },
  ];

  const transferColumns: Column<CrossBorderTransfer>[] = [
    { key: 'fromOrgId', label: 'From', render: (t) => { const org = orgs.find(o => o.id === t.fromOrgId); return <span className="text-sm">{org?.name ?? t.fromOrgId}</span>; } },
    { key: 'toOrgId', label: 'To', render: (t) => { const org = orgs.find(o => o.id === t.toOrgId); return <span className="text-sm">{org?.name ?? t.toOrgId}</span>; } },
    { key: 'fromRegion', label: 'Route', render: (t) => <span className="text-xs font-mono">{t.fromRegion} → {t.toRegion}</span> },
    { key: 'regulationApplicable', label: 'Regulation', render: (t) => <Badge color="accent">{t.regulationApplicable}</Badge> },
    { key: 'status', label: 'Status', render: (t) => {
      const colors: Record<string, 'success' | 'error' | 'warning' | 'secondary'> = { approved: 'success', blocked: 'error', pending: 'warning', requires_review: 'secondary' };
      return <Badge color={colors[t.status]} dot>{t.status.replace(/_/g, ' ')}</Badge>;
    }},
    { key: 'reason', label: 'Reason', render: (t) => <span className="text-xs text-secondary-600 dark:text-secondary-300 truncate block max-w-xs">{t.reason}</span> },
    { key: 'timestamp', label: 'Time', sortValue: (t) => t.timestamp, render: (t) => <span className="text-xs text-secondary-500">{formatDateTime(t.timestamp)}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Regulations Tracked" value={Object.keys(REGULATION_INFO).length} icon={<Shield className="w-4 h-4" />} color="primary" />
        <MetricCard label="Artifacts Generated" value={complianceArtifacts.length} icon={<FileStack className="w-4 h-4" />} color="accent" />
        <MetricCard label="Transfer Requests" value={crossBorderTransfers.length} icon={<Globe2 className="w-4 h-4" />} color="warning" />
        <MetricCard label="Blocked Transfers" value={crossBorderTransfers.filter(t => t.status === 'blocked').length} icon={<XCircle className="w-4 h-4" />} color="error" />
      </div>

      {/* Compliance Matrix */}
      <Card>
        <CardHeader title="Compliance Matrix" subtitle="Per-organization regulatory status" icon={<FileCheck className="w-4 h-4" />} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-800">
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Organization</th>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Region</th>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Regulation</th>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Rules</th>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Artifacts</th>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Status</th>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map(({ org, rules, artifacts, status }) => (
                  <tr key={org.id} className="border-b border-secondary-100 dark:border-secondary-800/50">
                    <td className="px-3 py-2.5 text-secondary-700 dark:text-secondary-300">{org.name}</td>
                    <td className="px-3 py-2.5"><Badge color="secondary">{org.region}</Badge></td>
                    <td className="px-3 py-2.5"><Badge color="accent">{org.regulation}</Badge></td>
                    <td className="px-3 py-2.5"><span className="tabular-nums text-sm">{rules.length}</span></td>
                    <td className="px-3 py-2.5"><span className="tabular-nums text-sm">{artifacts}</span></td>
                    <td className="px-3 py-2.5"><Badge color={statusColors[status] ?? 'secondary'} dot>{status.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-3 py-2.5">
                      <button className="btn-ghost text-xs" onClick={() => generateComplianceArtifact(org.id, org.regulation, 'audit_report')}>
                        <FileText className="w-3.5 h-3.5" /> Generate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Cross-border transfer simulator */}
      <Card>
        <CardHeader title="Cross-Border Transfer Checker" subtitle="Test data sovereignty rules — see what gets blocked" icon={<Globe2 className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="metric-label block mb-1.5">From (Source Org)</label>
              <select className="input-base" value={fromOrg} onChange={(e) => setFromOrg(e.target.value)}>
                {orgs.map((org) => <option key={org.id} value={org.id}>{org.name} ({org.region})</option>)}
              </select>
            </div>
            <div>
              <label className="metric-label block mb-1.5">To (Destination Org)</label>
              <select className="input-base" value={toOrg} onChange={(e) => setToOrg(e.target.value)}>
                {orgs.map((org) => <option key={org.id} value={org.id}>{org.name} ({org.region})</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full" onClick={() => requestCrossBorderTransfer(fromOrg, toOrg, ['anonymized_gradients', 'model_metrics'])}>
                <Send className="w-4 h-4" /> Test Transfer
              </button>
            </div>
          </div>
          <p className="text-xs text-secondary-400">The system automatically checks sovereignty contracts and applies GDPR Article 44, DPDP Section 16, and other regional rules.</p>
        </CardBody>
      </Card>

      {/* Regulation rules */}
      <Card>
        <CardHeader title="Regulatory Rules" subtitle="Automated compliance checks per regulation" icon={<Shield className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-2">
            {regulationRules.map((rule) => (
              <div key={rule.id} className="card p-3 bg-secondary-50 dark:bg-secondary-800/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color="accent">{rule.regulation}</Badge>
                      <Badge color="secondary">{rule.region}</Badge>
                      <span className="text-xs font-mono text-secondary-400">{rule.rule}</span>
                    </div>
                    <p className="text-sm text-secondary-700 dark:text-secondary-200">{rule.description}</p>
                    <p className="text-xs text-secondary-400 mt-0.5">{rule.requirement}</p>
                  </div>
                  {rule.automatedCheck && <Badge color="success" dot>Automated</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Artifacts table */}
      <Card>
        <CardHeader title="Compliance Artifacts" subtitle="Auto-generated audit reports and assessments" icon={<FileStack className="w-4 h-4" />} />
        <DataTable columns={artifactColumns} data={complianceArtifacts} rowKey={(a) => a.id} searchable emptyMessage="No artifacts generated yet. Run a training round or click Generate." />
      </Card>

      {/* Transfers table */}
      <Card>
        <CardHeader title="Cross-Border Transfer Log" subtitle="All transfer requests and their outcomes" icon={<Globe2 className="w-4 h-4" />} />
        <DataTable columns={transferColumns} data={crossBorderTransfers} rowKey={(t) => t.id} searchable emptyMessage="No transfer requests yet. Test a transfer above." />
      </Card>
    </div>
  );
}
