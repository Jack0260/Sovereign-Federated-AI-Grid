import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { MetricCard } from '@/components/shared/MetricCard';
import { Badge } from '@/components/shared/Badge';
import { StatusDot } from '@/components/shared/StatusDot';
import { formatCurrency, formatCarbon, formatNumber, formatCompact } from '@/lib/format';
import { REGULATION_INFO, ROUND_PHASES } from '@/lib/constants';
import {
  Network, KeyRound, ShoppingCart, GitBranch, Leaf, TrendingUp,
  Scale, Zap, FileCheck, Activity, Cpu, Globe2, Lock,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar,
} from '@/components/shared/Charts';
import type { PageId } from '@/lib/constants';

interface OverviewProps {
  onNavigate: (page: PageId) => void;
}

export function Overview({ onNavigate }: OverviewProps) {
  const orgs = useSovereignStore((s) => s.orgs);
  const rounds = useSovereignStore((s) => s.rounds);
  const proofs = useSovereignStore((s) => s.proofs);
  const models = useSovereignStore((s) => s.models);
  const invoices = useSovereignStore((s) => s.invoices);
  const carbonReports = useSovereignStore((s) => s.carbonReports);
  const listings = useSovereignStore((s) => s.listings);
  const orders = useSovereignStore((s) => s.orders);
  const contracts = useSovereignStore((s) => s.contracts);
  const approvals = useSovereignStore((s) => s.approvals);
  const auditEvents = useSovereignStore((s) => s.auditEvents);
  const complianceArtifacts = useSovereignStore((s) => s.complianceArtifacts);
  const isTraining = useSovereignStore((s) => s.isTraining);

  const verifiedProofs = proofs.filter((p) => p.status === 'verified').length;
  const totalComputeCost = invoices.reduce((sum, inv) => sum + inv.totalCost, 0);
  const totalCarbon = carbonReports.reduce((sum, r) => sum + r.carbonKg, 0);
  const greenEnergyPct = carbonReports.length > 0
    ? Math.round((carbonReports.filter((r) => ['solar', 'wind', 'hydro', 'nuclear'].includes(r.energySource)).length / carbonReports.length) * 100)
    : 100;
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const activeContracts = contracts.filter((c) => c.status === 'active').length;
  const deployedModels = models.filter((m) => m.status === 'deployed').length;

  const lossData = rounds.map((r) => ({
    round: `R${r.roundNumber}`,
    loss: parseFloat(r.globalLoss.toFixed(4)),
    gradient: parseFloat(r.gradientNorm.toFixed(4)),
  }));

  const orgTypeData = orgs.reduce((acc, org) => {
    const existing = acc.find((a) => a.type === org.type);
    if (existing) {
      existing.count++;
      existing.data += org.dataSize;
    } else {
      acc.push({ type: org.type, count: 1, data: org.dataSize });
    }
    return acc;
  }, [] as { type: string; count: number; data: number }[]);

  const subsystems: { id: PageId; label: string; icon: React.ReactNode; status: string; statusColor: 'success' | 'warning' | 'error' | 'secondary'; detail: string }[] = [
    { id: 'federation', label: 'Federation Runtime', icon: <Network className="w-4 h-4" />, status: isTraining ? 'Training' : 'Idle', statusColor: isTraining ? 'success' : 'secondary', detail: `${rounds.length} rounds completed` },
    { id: 'crypto', label: 'Crypto Proofs', icon: <KeyRound className="w-4 h-4" />, status: verifiedProofs > 0 ? 'Active' : 'Idle', statusColor: verifiedProofs > 0 ? 'success' : 'secondary', detail: `${verifiedProofs} proofs verified` },
    { id: 'governance', label: 'Governance', icon: <Scale className="w-4 h-4" />, status: pendingApprovals > 0 ? 'Action needed' : 'Nominal', statusColor: pendingApprovals > 0 ? 'warning' : 'success', detail: `${activeContracts} active contracts` },
    { id: 'marketplace', label: 'Compute Market', icon: <ShoppingCart className="w-4 h-4" />, status: 'Active', statusColor: 'success', detail: `${listings.length} listings, ${orders.length} orders` },
    { id: 'registry', label: 'Model Registry', icon: <GitBranch className="w-4 h-4" />, status: 'Active', statusColor: 'success', detail: `${models.length} versions, ${deployedModels} deployed` },
    { id: 'economics', label: 'Economics', icon: <TrendingUp className="w-4 h-4" />, status: 'Active', statusColor: 'success', detail: formatCurrency(totalComputeCost, true) },
    { id: 'inference', label: 'Edge Inference', icon: <Zap className="w-4 h-4" />, status: 'Ready', statusColor: 'success', detail: '5 edge endpoints' },
    { id: 'compliance', label: 'Compliance', icon: <FileCheck className="w-4 h-4" />, status: 'Compliant', statusColor: 'success', detail: `${complianceArtifacts.length} artifacts generated` },
  ];

  const recentEvents = auditEvents.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white">
          <Globe2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-50">SOVEREIGN Command Center</h2>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">Federated AI Grid — data never moves, only gradients do</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Organizations"
          value={orgs.length}
          unit="active"
          icon={<Network className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="Training Rounds"
          value={rounds.length}
          icon={<Activity className="w-4 h-4" />}
          color="primary"
          trend={rounds.length > 0 ? { value: 100, positive: true } : undefined}
        />
        <MetricCard
          label="ZK Proofs Verified"
          value={verifiedProofs}
          icon={<KeyRound className="w-4 h-4" />}
          color="success"
        />
        <MetricCard
          label="Compute Spend"
          value={formatCurrency(totalComputeCost, true)}
          icon={<TrendingUp className="w-4 h-4" />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total Carbon"
          value={totalCarbon.toFixed(2)}
          unit="kgCO2e"
          icon={<Leaf className="w-4 h-4" />}
          color="primary"
          trend={greenEnergyPct > 0 ? { value: greenEnergyPct, positive: true } : undefined}
        />
        <MetricCard
          label="Green Energy"
          value={greenEnergyPct}
          unit="%"
          icon={<Cpu className="w-4 h-4" />}
          color="success"
        />
        <MetricCard
          label="Model Versions"
          value={models.length}
          icon={<GitBranch className="w-4 h-4" />}
          color="accent"
        />
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={<Scale className="w-4 h-4" />}
          color={pendingApprovals > 0 ? 'warning' : 'secondary'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Global Model Loss"
            subtitle="Loss trajectory across federated training rounds"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <CardBody>
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={lossData}>
                  <defs>
                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="loss" stroke="#10b981" strokeWidth={2} fill="url(#lossGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-secondary-400 text-sm">
                No training rounds yet. Click "Start Round" to begin.
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Data Distribution by Org Type"
            subtitle="Volume of training data contributed"
            icon={<Network className="w-4 h-4" />}
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={orgTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value) => [formatNumber(Number(value)), 'Data Points']}
                />
                <Bar dataKey="data" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Subsystem grid */}
      <Card>
        <CardHeader
          title="Subsystem Status"
          subtitle="Health of all SOVEREIGN subsystems"
          icon={<Cpu className="w-4 h-4" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {subsystems.map((sys) => (
              <button
                key={sys.id}
                onClick={() => onNavigate(sys.id)}
                className="card card-hover p-3 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-secondary-600 dark:text-secondary-300">
                    {sys.icon}
                    <span className="text-xs font-semibold">{sys.label}</span>
                  </span>
                  <StatusDot color={sys.statusColor} pulse={sys.statusColor === 'success' && sys.status === 'Training'} />
                </div>
                <div className="flex items-center justify-between">
                  <Badge color={sys.statusColor}>{sys.status}</Badge>
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">{sys.detail}</span>
                </div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Bottom: Recent Activity + Orgs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest audit events across the grid"
            icon={<Activity className="w-4 h-4" />}
          />
          <CardBody>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-2 border-b border-secondary-100 dark:border-secondary-800/50 last:border-0">
                  <StatusDot
                    color={event.severity === 'critical' ? 'error' : event.severity === 'warning' ? 'warning' : 'success'}
                    className="mt-1.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-700 dark:text-secondary-300 truncate">{event.details}</p>
                    <p className="text-xs text-secondary-400 mt-0.5">
                      {event.actor} · {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge color={event.severity === 'critical' ? 'error' : event.severity === 'warning' ? 'warning' : 'secondary'}>
                    {event.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Federated Organizations"
            subtitle="Participating data nodes across jurisdictions"
            icon={<Lock className="w-4 h-4" />}
          />
          <CardBody>
            <div className="space-y-2">
              {orgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between py-2 border-b border-secondary-100 dark:border-secondary-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-800">
                      <Lock className="w-3.5 h-3.5 text-secondary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-200 truncate">{org.name}</p>
                      <p className="text-xs text-secondary-400">{org.region} · {formatCompact(org.dataSize)} records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="primary">{org.regulation}</Badge>
                    <StatusDot color={org.status === 'active' ? 'success' : 'warning'} pulse={org.status === 'active' && isTraining} />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
