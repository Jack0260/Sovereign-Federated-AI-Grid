import { useState } from 'react';
import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { formatDateTime, formatNumber } from '@/lib/format';
import { Zap, Server, Activity, Gauge, Send, Cpu } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from '@/components/shared/Charts';

export function Inference() {
  const orgs = useSovereignStore((s) => s.orgs);
  const models = useSovereignStore((s) => s.models);
  const inferenceRequests = useSovereignStore((s) => s.inferenceRequests);
  const runEdgeInference = useSovereignStore((s) => s.runEdgeInference);

  const [selectedOrg, setSelectedOrg] = useState(orgs[0]?.id ?? '');
  const [selectedModel, setSelectedModel] = useState(models.find((m) => m.status === 'deployed')?.id ?? models[0]?.id ?? '');
  const [inputSize, setInputSize] = useState(1024);

  const deployedModels = models.filter((m) => m.status === 'deployed' || m.status === 'trained');

  const latencyData = inferenceRequests.slice(0, 15).reverse().map((r) => ({
    id: r.id.slice(-4),
    edge: r.latencyMs,
    cloud: r.latencyMs + Math.floor(Math.random() * 150 + 50),
  }));

  const avgEdgeLatency = inferenceRequests.length > 0
    ? Math.round(inferenceRequests.reduce((s, r) => s + r.latencyMs, 0) / inferenceRequests.length)
    : 0;
  const avgCloudLatency = avgEdgeLatency + 120;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Inference Requests" value={inferenceRequests.length} icon={<Activity className="w-4 h-4" />} color="accent" />
        <MetricCard label="Avg Edge Latency" value={avgEdgeLatency} unit="ms" icon={<Gauge className="w-4 h-4" />} color="success" trend={avgEdgeLatency > 0 ? { value: 85, positive: true } : undefined} />
        <MetricCard label="Avg Cloud Latency" value={avgCloudLatency} unit="ms" icon={<Server className="w-4 h-4" />} color="warning" />
        <MetricCard label="Edge Endpoints" value={orgs.length} icon={<Zap className="w-4 h-4" />} color="primary" />
      </div>

      {/* Inference simulator */}
      <Card>
        <CardHeader title="Edge Inference Simulator" subtitle="Run on-premises inference — data never leaves the device" icon={<Zap className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="metric-label block mb-1.5">Organization</label>
              <select className="input-base" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
                {orgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
            </div>
            <div>
              <label className="metric-label block mb-1.5">Model</label>
              <select className="input-base" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                {deployedModels.map((m) => <option key={m.id} value={m.id}>{m.name} v{m.version}</option>)}
              </select>
            </div>
            <div>
              <label className="metric-label block mb-1.5">Input Size (tokens)</label>
              <input type="number" className="input-base" value={inputSize} onChange={(e) => setInputSize(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full" onClick={() => runEdgeInference(selectedOrg, selectedModel, inputSize)}>
                <Send className="w-4 h-4" /> Run Inference
              </button>
            </div>
          </div>

          {/* Edge vs Cloud comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 border-primary-500/20 bg-primary-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Edge Inference</span>
              </div>
              <p className="text-2xl font-bold font-mono text-secondary-900 dark:text-secondary-50">{avgEdgeLatency || '—'}<span className="text-sm text-secondary-400 ml-1">ms</span></p>
              <p className="text-xs text-secondary-400 mt-1">On-prem · data stays local</p>
            </div>
            <div className="card p-4 border-warning-500/20 bg-warning-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-warning-500" />
                <span className="text-sm font-semibold text-warning-600 dark:text-warning-400">Cloud Inference</span>
              </div>
              <p className="text-2xl font-bold font-mono text-secondary-900 dark:text-secondary-50">{avgCloudLatency || '—'}<span className="text-sm text-secondary-400 ml-1">ms</span></p>
              <p className="text-xs text-secondary-400 mt-1">Remote · data traverses network</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Latency chart */}
      {latencyData.length > 0 && (
        <Card>
          <CardHeader title="Latency Comparison" subtitle="Edge vs cloud response time per request" icon={<Gauge className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="ms" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="edge" fill="#10b981" name="Edge" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cloud" fill="#f59e0b" name="Cloud" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Request log */}
      <Card>
        <CardHeader title="Inference Request Log" subtitle="Recent on-prem inference requests" icon={<Cpu className="w-4 h-4" />} />
        <CardBody>
          {inferenceRequests.length === 0 ? (
            <p className="text-sm text-secondary-400 text-center py-8">No inference requests yet. Run an inference above.</p>
          ) : (
            <div className="space-y-2">
              {inferenceRequests.slice(0, 15).map((req) => {
                const org = orgs.find(o => o.id === req.orgId);
                const model = models.find(m => m.id === req.modelVersionId);
                return (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b border-secondary-100 dark:border-secondary-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-200">{org?.name ?? req.orgId}</p>
                        <p className="text-xs text-secondary-400">{model?.name} v{model?.version} · {formatNumber(req.inputSize)} tokens · {req.edgeLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">{req.latencyMs}ms</span>
                      <Badge color="success" dot>Success</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
