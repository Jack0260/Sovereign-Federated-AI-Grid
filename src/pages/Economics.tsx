import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatCurrency, formatCarbon, formatNumber, formatDateTime } from '@/lib/format';
import { ENERGY_SOURCE_INFO } from '@/lib/constants';
import { TrendingUp, Leaf, Coins, Receipt, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from '@/components/shared/Charts';
import type { Invoice, CarbonReport, TokenLedgerEntry } from '@/types';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#22c55e'];

export function Economics() {
  const invoices = useSovereignStore((s) => s.invoices);
  const tokenLedger = useSovereignStore((s) => s.tokenLedger);
  const carbonReports = useSovereignStore((s) => s.carbonReports);
  const orgs = useSovereignStore((s) => s.orgs);

  const totalCost = invoices.reduce((s, i) => s + i.totalCost, 0);
  const totalCarbon = carbonReports.reduce((s, r) => sum(s, r.carbonKg), 0);
  const greenEnergyPct = carbonReports.length > 0
    ? Math.round((carbonReports.filter((r) => ENERGY_SOURCE_INFO[r.energySource as keyof typeof ENERGY_SOURCE_INFO]?.isGreen).length / carbonReports.length) * 100)
    : 100;

  function sum(a: number, b: number) { return a + b; }

  const orgCostData = orgs.map((org) => {
    const orgInvoices = invoices.filter((i) => i.orgId === org.id);
    return {
      name: org.name.split(' ')[0],
      cost: orgInvoices.reduce((s, i) => s + i.totalCost, 0),
      carbon: orgInvoices.reduce((s, i) => s + i.carbonKg, 0),
    };
  }).filter((d) => d.cost > 0);

  const energyData = Object.entries(
    carbonReports.reduce((acc, r) => {
      acc[r.energySource] = (acc[r.energySource] ?? 0) + r.carbonKg;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const invoiceColumns: Column<Invoice>[] = [
    { key: 'orgId', label: 'Organization', render: (i) => { const org = orgs.find(o => o.id === i.orgId); return <span className="text-sm">{org?.name ?? i.orgId}</span>; } },
    { key: 'computeCost', label: 'Compute', sortValue: (i) => i.computeCost, render: (i) => <span className="font-mono text-sm">{formatCurrency(i.computeCost)}</span> },
    { key: 'carbonCost', label: 'Carbon', render: (i) => <span className="font-mono text-sm">{formatCurrency(i.carbonCost)}</span> },
    { key: 'tokenCost', label: 'Tokens', render: (i) => <Badge color="warning">{i.tokenCost}</Badge> },
    { key: 'totalCost', label: 'Total', sortValue: (i) => i.totalCost, render: (i) => <span className="font-mono text-sm font-semibold">{formatCurrency(i.totalCost)}</span> },
    { key: 'carbonKg', label: 'CO2', render: (i) => <span className="text-xs">{formatCarbon(i.carbonKg)}</span> },
    { key: 'energySource', label: 'Energy', render: (i) => <Badge color={ENERGY_SOURCE_INFO[i.energySource as keyof typeof ENERGY_SOURCE_INFO]?.isGreen ? 'success' : 'error'}>{i.energySource}</Badge> },
    { key: 'timestamp', label: 'Date', sortValue: (i) => i.timestamp, render: (i) => <span className="text-xs text-secondary-500">{formatDateTime(i.timestamp)}</span> },
  ];

  const tokenColumns: Column<TokenLedgerEntry>[] = [
    { key: 'orgId', label: 'Organization', render: (l) => { const org = orgs.find(o => o.id === l.orgId); return <span className="text-sm">{org?.name ?? l.orgId}</span>; } },
    { key: 'type', label: 'Type', render: (l) => <Badge color={l.type === 'credit' || l.type === 'reward' ? 'success' : l.type === 'debit' ? 'error' : 'warning'}>{l.type}</Badge> },
    { key: 'amount', label: 'Amount', sortValue: (l) => l.amount, render: (l) => <span className={`font-mono text-sm font-semibold ${l.type === 'debit' || l.type === 'penalty' ? 'text-error-500' : 'text-success-500'}`}>{l.type === 'debit' || l.type === 'penalty' ? '-' : '+'}{formatNumber(l.amount)}</span> },
    { key: 'reason', label: 'Reason', render: (l) => <span className="text-xs text-secondary-600 dark:text-secondary-300">{l.reason}</span> },
    { key: 'balanceAfter', label: 'Balance', render: (l) => <span className="font-mono text-sm">{formatNumber(l.balanceAfter)}</span> },
    { key: 'timestamp', label: 'Date', sortValue: (l) => l.timestamp, render: (l) => <span className="text-xs text-secondary-500">{formatDateTime(l.timestamp)}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Compute Cost" value={formatCurrency(totalCost, true)} icon={<DollarSign className="w-4 h-4" />} color="warning" trend={totalCost > 0 ? { value: 32, positive: false } : undefined} />
        <MetricCard label="Total Carbon" value={totalCarbon.toFixed(2)} unit="kg" icon={<Leaf className="w-4 h-4" />} color="primary" trend={greenEnergyPct > 50 ? { value: 45, positive: true } : undefined} />
        <MetricCard label="Green Energy" value={greenEnergyPct} unit="%" icon={<Leaf className="w-4 h-4" />} color="success" />
        <MetricCard label="Token Transactions" value={tokenLedger.length} icon={<Coins className="w-4 h-4" />} color="accent" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Cost per Organization" subtitle="Compute spend breakdown" icon={<BarChart3 className="w-4 h-4" />} />
          <CardBody>
            {orgCostData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={orgCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[220px] flex items-center justify-center text-secondary-400 text-sm">No invoices yet</div>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Energy Mix" subtitle="Carbon emissions by energy source" icon={<Leaf className="w-4 h-4" />} />
          <CardBody>
            {energyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={energyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                    {energyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} formatter={(v) => formatCarbon(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[220px] flex items-center justify-center text-secondary-400 text-sm">No carbon data yet</div>}
          </CardBody>
        </Card>
      </div>

      {/* Token balances */}
      <Card>
        <CardHeader title="Token Balances" subtitle="Compute credit balance per organization" icon={<Coins className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orgs.map((org) => {
              const entries = tokenLedger.filter((l) => l.orgId === org.id);
              const balance = entries.reduce((s, l) => s + (l.type === 'credit' || l.type === 'reward' ? l.amount : -l.amount), 0);
              const spent = entries.filter((l) => l.type === 'debit').reduce((s, l) => s + l.amount, 0);
              return (
                <div key={org.id} className="card p-3">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-200 truncate mb-1">{org.name}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-secondary-400">Balance</p>
                      <p className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400">{formatNumber(balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary-400">Spent</p>
                      <p className="text-sm font-mono text-secondary-600 dark:text-secondary-300">{formatNumber(spent)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Invoice History" subtitle="All compute billing records" icon={<Receipt className="w-4 h-4" />} />
        <DataTable columns={invoiceColumns} data={invoices} rowKey={(i) => i.id} searchable searchPlaceholder="Search invoices..." emptyMessage="No invoices yet. Start a training round." />
      </Card>

      <Card>
        <CardHeader title="Token Ledger" subtitle="All compute credit transactions" icon={<Coins className="w-4 h-4" />} />
        <DataTable columns={tokenColumns} data={tokenLedger} rowKey={(l) => l.id} searchable searchPlaceholder="Search ledger..." maxHeight="400px" />
      </Card>
    </div>
  );
}
