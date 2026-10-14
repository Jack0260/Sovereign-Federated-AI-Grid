import { useSovereignStore } from '@/store/SovereignContext';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { formatCurrency, formatCarbon, formatCompact } from '@/lib/format';
import { ENERGY_SOURCE_INFO, COMPUTE_TYPE_INFO } from '@/lib/constants';
import { ShoppingCart, Leaf, Zap, TrendingUp, Sun, Wind, Droplets, Atom, Flame, Factory, Clock } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from '@/components/shared/Charts';
import type { ComputeListing } from '@/types';

const ENERGY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  solar: Sun, wind: Wind, hydro: Droplets, nuclear: Atom, natural_gas: Flame, coal: Factory,
};

export function Marketplace() {
  const listings = useSovereignStore((s) => s.listings);
  const orders = useSovereignStore((s) => s.orders);
  const carbonForecast = useSovereignStore((s) => s.carbonForecast);
  const orgs = useSovereignStore((s) => s.orgs);
  const placeOrder = useSovereignStore((s) => s.placeOrder);

  const avgPrice = listings.length > 0 ? listings.reduce((s, l) => s + l.pricePerHour, 0) / listings.length : 0;
  const greenListings = listings.filter((l) => ENERGY_SOURCE_INFO[l.energySource].isGreen);
  const greenPct = listings.length > 0 ? Math.round((greenListings.length / listings.length) * 100) : 0;
  const totalRevenue = orders.reduce((s, o) => s + o.totalCost, 0);
  const totalCarbonSaved = orders.reduce((s, o) => {
    const coal = 0.82 * o.hours * 10;
    return s + (coal - o.carbonEstimate);
  }, 0);

  const forecastData = carbonForecast.slice(0, 12).map((f) => ({
    time: new Date(f.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' }),
    carbon: f.carbonIntensity,
    solar: f.solarMW,
    wind: f.windMW,
    hydro: f.hydroMW,
    recommended: f.recommendedSlot,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Avg Price/hr" value={formatCurrency(avgPrice)} icon={<TrendingUp className="w-4 h-4" />} color="warning" />
        <MetricCard label="Green Listings" value={greenPct} unit="%" icon={<Leaf className="w-4 h-4" />} color="success" />
        <MetricCard label="Active Orders" value={orders.length} icon={<ShoppingCart className="w-4 h-4" />} color="accent" />
        <MetricCard label="Carbon Saved" value={formatCarbon(totalCarbonSaved)} icon={<Leaf className="w-4 h-4" />} color="primary" />
      </div>

      {/* Carbon forecast */}
      <Card>
        <CardHeader title="Carbon-Aware Scheduling" subtitle="24-hour renewable energy forecast — compute routed to green slots" icon={<Leaf className="w-4 h-4" />} />
        <CardBody>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
              <Line type="monotone" dataKey="carbon" stroke="#10b981" strokeWidth={2} name="Carbon Intensity" dot={false} />
              <Line type="monotone" dataKey="solar" stroke="#f59e0b" strokeWidth={1.5} name="Solar MW" dot={false} />
              <Line type="monotone" dataKey="wind" stroke="#06b6d4" strokeWidth={1.5} name="Wind MW" dot={false} />
              <Line type="monotone" dataKey="hydro" stroke="#22c55e" strokeWidth={1.5} name="Hydro MW" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-secondary-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-500" /> Carbon Intensity</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning-500" /> Solar</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-500" /> Wind</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-500" /> Hydro</span>
          </div>
        </CardBody>
      </Card>

      {/* Listings */}
      <Card>
        <CardHeader title="Compute Listings" subtitle="Available GPU/TPU clusters from providers worldwide" icon={<Zap className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {listings.map((listing) => {
              const EnergyIcon = ENERGY_ICONS[listing.energySource] ?? Zap;
              const energy = ENERGY_SOURCE_INFO[listing.energySource];
              return (
                <div key={listing.id} className="card card-hover p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">{listing.providerName}</p>
                      <p className="text-xs text-secondary-400">{listing.model} · {listing.region}</p>
                    </div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${energy.isGreen ? 'bg-primary-500/10 text-primary-500' : 'bg-error-500/10 text-error-500'}`}>
                      <EnergyIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div><span className="text-secondary-400">Price/hr</span><p className="font-semibold text-secondary-900 dark:text-secondary-100">{formatCurrency(listing.pricePerHour)}</p></div>
                    <div><span className="text-secondary-400">Carbon</span><p className="font-semibold text-secondary-900 dark:text-secondary-100">{listing.carbonIntensity} kg</p></div>
                    <div><span className="text-secondary-400">Type</span><p className="font-semibold text-secondary-900 dark:text-secondary-100">{listing.computeType}</p></div>
                    <div><span className="text-secondary-400">Available</span><p className="font-semibold text-secondary-900 dark:text-secondary-100">{listing.totalHours}h</p></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge color={energy.isGreen ? 'success' : 'error'} dot>{energy.label}</Badge>
                    {listing.availability === 'available' ? (
                      <button className="btn-primary text-xs px-3 py-1.5" onClick={() => placeOrder(listing.id, orgs[0]?.id ?? '', 4)}>
                        <ShoppingCart className="w-3 h-3" /> Buy 4h
                      </button>
                    ) : (
                      <Badge color="warning">Reserved</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Orders */}
      {orders.length > 0 && (
        <Card>
          <CardHeader title="Order History" subtitle={`${orders.length} compute orders placed`} icon={<ShoppingCart className="w-4 h-4" />} />
          <CardBody>
            <div className="space-y-2">
              {orders.slice(0, 10).map((order) => {
                const org = orgs.find((o) => o.id === order.orgId);
                const listing = listings.find((l) => l.id === order.listingId);
                return (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-secondary-100 dark:border-secondary-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-500/10 text-accent-500">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-200">{org?.name ?? order.orgId}</p>
                        <p className="text-xs text-secondary-400">{order.hours}h · {listing?.providerName ?? order.listingId} · {order.computeType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">{formatCurrency(order.totalCost)}</p>
                        <p className="text-xs text-secondary-400">{formatCarbon(order.carbonEstimate)}</p>
                      </div>
                      <Badge color={ENERGY_SOURCE_INFO[order.energySource].isGreen ? 'success' : 'error'}>{ENERGY_SOURCE_INFO[order.energySource].label}</Badge>
                      {order.scheduledSlot && <Badge color="primary" dot>Scheduled</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
