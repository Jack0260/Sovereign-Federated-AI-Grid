import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { StatusDot } from '@/components/shared/StatusDot';
import { MetricCard } from '@/components/shared/MetricCard';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatNumber, formatCompact, formatDuration } from '@/lib/format';
import { ROUND_PHASES, REGULATION_INFO, ORG_TYPES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import {
  Network, Lock, Activity, Cpu, Server, Shield, Layers, GitMerge,
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, AreaChart, Area, BarChart, Bar,
} from '@/components/shared/Charts';
import type { TrainingRound, OrgRoundMetric } from '@/types';

export function Federation() {
  const orgs = useSovereignStore((s) => s.orgs);
  const enclaves = useSovereignStore((s) => s.enclaves);
  const rounds = useSovereignStore((s) => s.rounds);
  const isTraining = useSovereignStore((s) => s.isTraining);
  const currentRoundId = useSovereignStore((s) => s.currentRoundId);

  const currentRound = rounds.find((r) => r.id === currentRoundId);
  const activeOrgs = orgs.filter((o) => o.status === 'active');

  const lossData = rounds.map((r) => ({
    round: `R${r.roundNumber}`,
    loss: parseFloat(r.globalLoss.toFixed(4)),
    gradient: parseFloat(r.gradientNorm.toFixed(4)),
  }));

  const gradientData = rounds.map((r) => ({
    round: `R${r.roundNumber}`,
    ...Object.fromEntries(
      r.participatingOrgs.map((oid) => {
        const org = orgs.find((o) => o.id === oid);
        return [org?.name.split(' ')[0] ?? oid, parseFloat((r.orgMetrics[oid]?.gradientNorm ?? 0).toFixed(4))];
      })
    ),
  }));

  const orgColors = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#22c55e'];

  const roundColumns: Column<TrainingRound>[] = [
    {
      key: 'roundNumber',
      label: 'Round',
      sortValue: (r) => r.roundNumber,
      render: (r) => <span className="font-semibold text-secondary-900 dark:text-secondary-100">#{r.roundNumber}</span>,
    },
    {
      key: 'phase',
      label: 'Phase',
      render: (r) => {
        const phase = ROUND_PHASES[r.phase];
        return <Badge color={phase.color as 'primary' | 'secondary' | 'accent' | 'warning' | 'error' | 'success'}>{phase.label}</Badge>;
      },
    },
    {
      key: 'participatingOrgs',
      label: 'Orgs',
      sortValue: (r) => r.participatingOrgs.length,
      render: (r) => <span className="tabular-nums">{r.participatingOrgs.length}</span>,
    },
    {
      key: 'globalLoss',
      label: 'Loss',
      sortValue: (r) => r.globalLoss,
      render: (r) => <span className="tabular-nums font-mono text-sm">{r.globalLoss.toFixed(4)}</span>,
    },
    {
      key: 'gradientNorm',
      label: 'Gradient Norm',
      sortValue: (r) => r.gradientNorm,
      render: (r) => <span className="tabular-nums font-mono text-sm">{r.gradientNorm.toFixed(4)}</span>,
    },
    {
      key: 'proofIds',
      label: 'Proofs',
      sortValue: (r) => r.proofIds.length,
      render: (r) => <Badge color="accent">{r.proofIds.length}</Badge>,
    },
    {
      key: 'startedAt',
      label: 'Started',
      sortValue: (r) => r.startedAt,
      render: (r) => <span className="text-xs text-secondary-500">{new Date(r.startedAt).toLocaleTimeString()}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Active Organizations"
          value={activeOrgs.length}
          icon={<Network className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="Training Rounds"
          value={rounds.length}
          icon={<Activity className="w-4 h-4" />}
          color="primary"
        />
        <MetricCard
          label="Sealed Enclaves"
          value={enclaves.filter((e) => e.status === 'sealed').length}
          icon={<Lock className="w-4 h-4" />}
          color="success"
        />
        <MetricCard
          label="Total Data Points"
          value={formatCompact(orgs.reduce((sum, o) => sum + o.dataSize, 0))}
          icon={<Layers className="w-4 h-4" />}
          color="warning"
        />
      </div>

      {/* Current round status */}
      {currentRound && (
        <Card className="border-primary-500/30">
          <CardHeader
            title={`Round #${currentRound.roundNumber} — ${ROUND_PHASES[currentRound.phase].label}`}
            subtitle="Live federated training in progress"
            icon={<Activity className="w-4 h-4 text-primary-500" />}
            action={<Badge color="primary" dot>Live</Badge>}
          />
          <CardBody>
            {/* Phase progress bar */}
            <div className="flex items-center gap-2 mb-4">
              {(['initializing', 'local_training', 'gradient_collection', 'aggregation', 'distribution', 'completed'] as const).map((phase, i) => {
                const currentIdx = ['initializing', 'local_training', 'gradient_collection', 'aggregation', 'distribution', 'completed'].indexOf(currentRound.phase);
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                  <div key={phase} className="flex items-center flex-1">
                    <div className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0',
                      isDone ? 'bg-primary-500 text-white' : isActive ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/40' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-400'
                    )}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    {i < 5 && <div className={cn('flex-1 h-0.5 mx-1 rounded', isDone ? 'bg-primary-500' : 'bg-secondary-200 dark:bg-secondary-700')} />}
                  </div>
                );
              })}
            </div>

            {/* Per-org metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentRound.participatingOrgs.map((orgId) => {
                const org = orgs.find((o) => o.id === orgId);
                const metric = currentRound.orgMetrics[orgId];
                if (!org || !metric) return null;
                return (
                  <div key={orgId} className="card p-3 bg-secondary-50 dark:bg-secondary-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-secondary-700 dark:text-secondary-200 truncate">{org.name}</span>
                      <StatusDot color={metric.status === 'aggregated' ? 'success' : metric.status === 'submitted' ? 'accent' : 'warning'} pulse={metric.status === 'training'} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-secondary-400">Loss</span>
                        <p className="font-mono font-semibold text-secondary-900 dark:text-secondary-100">{metric.localLoss.toFixed(4)}</p>
                      </div>
                      <div>
                        <span className="text-secondary-400">Accuracy</span>
                        <p className="font-mono font-semibold text-secondary-900 dark:text-secondary-100">{(metric.localAccuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-secondary-400">Grad Norm</span>
                        <p className="font-mono font-semibold text-secondary-900 dark:text-secondary-100">{metric.gradientNorm.toFixed(4)}</p>
                      </div>
                      <div>
                        <span className="text-secondary-400">Samples</span>
                        <p className="font-mono font-semibold text-secondary-900 dark:text-secondary-100">{formatNumber(metric.samplesProcessed)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Global Loss Curve"
            subtitle="Model convergence across federated rounds"
            icon={<Activity className="w-4 h-4" />}
          />
          <CardBody>
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={lossData}>
                  <defs>
                    <linearGradient id="fedLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
                  <Area type="monotone" dataKey="loss" stroke="#10b981" strokeWidth={2} fill="url(#fedLoss)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-secondary-400 text-sm">No training data yet</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Per-Org Gradient Norms"
            subtitle="Gradient flow from each organization"
            icon={<GitMerge className="w-4 h-4" />}
          />
          <CardBody>
            {gradientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={gradientData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
                  {orgs.slice(0, 5).map((org, i) => {
                    const key = org.name.split(' ')[0];
                    return (
                      <Line
                        key={org.id}
                        type="monotone"
                        dataKey={key}
                        stroke={orgColors[i]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-secondary-400 text-sm">No gradient data yet</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Data Flow Visualization */}
      <Card>
        <CardHeader
          title="Data Sovereignty Model"
          subtitle="Data never moves — only encrypted gradients flow to the coordinator"
          icon={<Shield className="w-4 h-4" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            {/* Orgs with enclaves */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400 mb-2">Data Nodes (Enclaves)</p>
              {orgs.map((org, i) => (
                <div key={org.id} className="card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-xs font-medium text-secondary-700 dark:text-secondary-200 truncate">{org.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary-400">
                    <span>Enclave: {org.enclaveId}</span>
                    <Badge color="success">Sealed</Badge>
                  </div>
                  <div className="mt-1.5 text-xs text-primary-600 dark:text-primary-400 font-mono">
                    Data stays: {formatCompact(org.dataSize)} records
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-xs text-secondary-400 mb-2 text-center">
                Encrypted gradients<br />flow outbound
              </div>
              <div className="flex flex-col items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-8 rounded-full bg-gradient-to-b from-primary-500 to-accent-500 opacity-60"
                    style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }}
                  />
                ))}
              </div>
              <div className="text-xs text-secondary-400 mt-2 text-center">
                Raw data never<br />leaves jurisdiction
              </div>
            </div>

            {/* Coordinator */}
            <div className="flex flex-col items-center justify-center">
              <div className="card p-6 text-center border-primary-500/20 bg-primary-500/5">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mb-3">
                  <Server className="w-8 h-8 text-primary-500" />
                </div>
                <p className="text-sm font-bold text-secondary-900 dark:text-secondary-50">FedAvg Coordinator</p>
                <p className="text-xs text-secondary-400 mt-1">Aggregates gradients<br />verifies proofs<br />distributes new weights</p>
                <Badge color="primary" className="mt-3" dot>Active</Badge>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Round history */}
      <Card>
        <CardHeader
          title="Training Round History"
          subtitle="All federated training rounds"
          icon={<Activity className="w-4 h-4" />}
        />
        <DataTable
          columns={roundColumns}
          data={rounds}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Search rounds..."
          emptyMessage="No training rounds yet. Click Start Round to begin."
        />
      </Card>
    </div>
  );
}
