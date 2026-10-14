import { useState, useRef, useEffect, type ReactNode } from 'react';
import React from 'react';

/* ------------------------------------------------------------------ */
/*  ResponsiveContainer                                                */
/* ------------------------------------------------------------------ */
export function ResponsiveContainer({
  width = '100%',
  height = 200,
  children,
}: {
  width?: string | number;
  height?: number | string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const h = typeof height === 'number' ? height : parseInt(String(height), 10) || 200;
  const resolvedWidth = typeof width === 'number' ? width : w;

  if (!resolvedWidth) return <div ref={ref} style={{ width, height: h }} />;

  return (
    <div ref={ref} style={{ width, height: h }}>
      <svg width={resolvedWidth} height={h} style={{ display: 'block', overflow: 'visible' }}>
        {children}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  No-op stubs (render nothing, handled internally by charts)         */
/* ------------------------------------------------------------------ */
export function CartesianGrid(_: any) { return null; }
export function XAxis(_: any) { return null; }
export function YAxis(_: any) { return null; }
export function Tooltip(_: any) { return null; }
export function Bar(_: any) { return null; }
Bar.displayName = 'Bar';
export function Line(_: any) { return null; }
Line.displayName = 'Line';
export function Area(_: any) { return null; }
Area.displayName = 'Area';
export function Cell(_: any) { return null; }
export function Pie(_: any) { return null; }
Pie.displayName = 'Pie';
export function Defs(_: any) { return null; }
export function LinearGradient(_: any) { return null; }
export function Stop(_: any) { return null; }

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const PAD = { top: 10, right: 10, bottom: 24, left: 48 };
const TF = 11;
const TC = '#64748b';

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const m = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / m) * m;
}

function niceTicks(max: number, n = 5): number[] {
  if (max <= 0) return [0, 1];
  const step = max / n;
  const m = Math.pow(10, Math.floor(Math.log10(step)));
  const ns = Math.ceil(step / m) * m;
  const out: number[] = [];
  for (let v = 0; v <= max + ns * 0.01; v += ns) out.push(Math.round(v * 1000) / 1000);
  return out;
}

function useMeasuredWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

interface ChartData { [key: string]: string | number }

interface BarCfg { dataKey: string; fill: string; name?: string; radius?: number | number[] }
interface LineCfg { dataKey: string; stroke: string; strokeWidth?: number; name?: string; dot?: boolean; connectNulls?: boolean }
interface AreaCfg { dataKey: string; stroke: string; strokeWidth?: number; fill: string }

function extractChildren(children: ReactNode, kinds: string[]): Record<string, any[]> {
  const result: Record<string, any[]> = {};
  for (const k of kinds) result[k] = [];
  const arr = React.Children.toArray(children);
  for (const child of arr) {
    if (!React.isValidElement(child)) continue;
    const name = typeof child.type === 'function' ? (child.type as any).displayName || (child.type as any).name : '';
    if (kinds.includes(name)) {
      result[name].push((child as any).props ?? {});
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  BarChart                                                           */
/* ------------------------------------------------------------------ */
export function BarChart({ data, children, height = 200 }: { data: ChartData[]; children: ReactNode; width?: number; height?: number }) {
  const [ref, w] = useMeasuredWidth();
  const innerW = Math.max(0, w - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);

  const parts = extractChildren(children, ['Bar', 'XAxis', 'YAxis']);
  const bars = parts.Bar as BarCfg[];
  const xKey = (parts.XAxis[0]?.dataKey) ?? 'name';
  const yTickFmt = parts.YAxis[0]?.tickFormatter;
  const yUnit = parts.YAxis[0]?.unit ?? '';

  let yMax = 0;
  for (const b of bars) for (const d of data) { const v = Number(d[b.dataKey] ?? 0); if (v > yMax) yMax = v; }
  yMax = niceMax(yMax);
  const yT = niceTicks(yMax);
  const yTop = yT[yT.length - 1] || 1;

  const xScale = (i: number) => PAD.left + (innerW * (i + 0.5)) / Math.max(1, data.length);
  const barW = (innerW / Math.max(1, data.length)) * 0.7 / Math.max(1, bars.length);

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block' }}>
          {yT.map((t) => {
            const y = PAD.top + (1 - t / yTop) * innerH;
            return <line key={`h${t}`} x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#334155" strokeDasharray="3 3" opacity={0.2} />;
          })}
          <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#334155" opacity={0.3} />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH} stroke="#334155" opacity={0.3} />
          {yT.map((t) => (
            <text key={`y${t}`} x={PAD.left - 6} y={PAD.top + (1 - t / yTop) * innerH + 3} fontSize={TF} fill={TC} textAnchor="end">
              {(yTickFmt ? yTickFmt(t) : t) + yUnit}
            </text>
          ))}
          {data.map((d, i) => (
            <text key={`x${i}`} x={xScale(i)} y={PAD.top + innerH + 16} fontSize={TF} fill={TC} textAnchor="middle">
              {String(d[xKey] ?? '')}
            </text>
          ))}
          {bars.map((bar, bi) => data.map((d, i) => {
            const v = Number(d[bar.dataKey] ?? 0);
            const bh = (v / yTop) * innerH;
            const bx = xScale(i) - (bars.length * barW) / 2 + bi * barW;
            const r = Array.isArray(bar.radius) ? bar.radius[0] : bar.radius ?? 0;
            return (
              <rect key={`b${bi}-${i}`} x={bx} y={PAD.top + innerH - bh} width={Math.max(0, barW - 1)} height={bh} fill={bar.fill} rx={r} ry={r}>
                <title>{`${bar.name ?? bar.dataKey}: ${v}`}</title>
              </rect>
            );
          }))}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LineChart                                                          */
/* ------------------------------------------------------------------ */
export function LineChart({ data, children, height = 200 }: { data: ChartData[]; children: ReactNode; width?: number; height?: number }) {
  const [ref, w] = useMeasuredWidth();
  const innerW = Math.max(0, w - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);

  const parts = extractChildren(children, ['Line', 'XAxis', 'YAxis']);
  const lines = parts.Line as LineCfg[];
  const xKey = (parts.XAxis[0]?.dataKey) ?? 'name';

  let yMax = 0;
  for (const l of lines) for (const d of data) { const v = Number(d[l.dataKey] ?? 0); if (v > yMax) yMax = v; }
  yMax = niceMax(yMax || 1);
  const yT = niceTicks(yMax);
  const yTop = yT[yT.length - 1] || 1;

  const xScale = (i: number) => data.length <= 1 ? PAD.left + innerW / 2 : PAD.left + (innerW * i) / (data.length - 1);

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block' }}>
          {yT.map((t) => {
            const y = PAD.top + (1 - t / yTop) * innerH;
            return <line key={`h${t}`} x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#334155" strokeDasharray="3 3" opacity={0.2} />;
          })}
          <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#334155" opacity={0.3} />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH} stroke="#334155" opacity={0.3} />
          {yT.map((t) => (
            <text key={`y${t}`} x={PAD.left - 6} y={PAD.top + (1 - t / yTop) * innerH + 3} fontSize={TF} fill={TC} textAnchor="end">{t}</text>
          ))}
          {data.map((d, i) => (
            <text key={`x${i}`} x={xScale(i)} y={PAD.top + innerH + 16} fontSize={TF} fill={TC} textAnchor="middle">{String(d[xKey] ?? '')}</text>
          ))}
          {lines.map((line, li) => {
            const pts = data.map((d, i) => {
              const v = Number(d[line.dataKey] ?? 0);
              return `${xScale(i)},${PAD.top + (1 - v / yTop) * innerH}`;
            }).join(' ');
            return (
              <polyline key={`l${li}`} points={pts} fill="none" stroke={line.stroke} strokeWidth={line.strokeWidth ?? 2} strokeLinejoin="round" strokeLinecap="round">
                <title>{line.name ?? line.dataKey}</title>
              </polyline>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AreaChart                                                          */
/* ------------------------------------------------------------------ */
export function AreaChart({ data, children, height = 200 }: { data: ChartData[]; children: ReactNode; width?: number; height?: number }) {
  const [ref, w] = useMeasuredWidth();
  const innerW = Math.max(0, w - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);

  const parts = extractChildren(children, ['Area', 'XAxis', 'YAxis']);
  const areas = parts.Area as AreaCfg[];
  const xKey = (parts.XAxis[0]?.dataKey) ?? 'name';

  let yMax = 0;
  for (const a of areas) for (const d of data) { const v = Number(d[a.dataKey] ?? 0); if (v > yMax) yMax = v; }
  yMax = niceMax(yMax || 1);
  const yT = niceTicks(yMax);
  const yTop = yT[yT.length - 1] || 1;

  const xScale = (i: number) => data.length <= 1 ? PAD.left + innerW / 2 : PAD.left + (innerW * i) / (data.length - 1);

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block' }}>
          {yT.map((t) => {
            const y = PAD.top + (1 - t / yTop) * innerH;
            return <line key={`h${t}`} x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#334155" strokeDasharray="3 3" opacity={0.2} />;
          })}
          <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#334155" opacity={0.3} />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH} stroke="#334155" opacity={0.3} />
          {yT.map((t) => (
            <text key={`y${t}`} x={PAD.left - 6} y={PAD.top + (1 - t / yTop) * innerH + 3} fontSize={TF} fill={TC} textAnchor="end">{t}</text>
          ))}
          {data.map((d, i) => (
            <text key={`x${i}`} x={xScale(i)} y={PAD.top + innerH + 16} fontSize={TF} fill={TC} textAnchor="middle">{String(d[xKey] ?? '')}</text>
          ))}
          {areas.map((area, ai) => {
            const coords = data.map((d, i) => ({
              x: xScale(i),
              y: PAD.top + (1 - Number(d[area.dataKey] ?? 0) / yTop) * innerH,
            }));
            const linePath = coords.map((c) => `${c.x},${c.y}`).join(' ');
            const fillPath = coords.length > 0
              ? `${coords.map((c) => `${c.x},${c.y}`).join(' ')} ${coords[coords.length - 1].x},${PAD.top + innerH} ${coords[0].x},${PAD.top + innerH}`
              : '';
            return (
              <g key={`a${ai}`}>
                {fillPath && <polygon points={fillPath} fill={area.fill} opacity={0.3} />}
                <polyline points={linePath} fill="none" stroke={area.stroke} strokeWidth={area.strokeWidth ?? 2} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PieChart + Pie                                                     */
/* ------------------------------------------------------------------ */
const PIE_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#22c55e', '#8b5cf6', '#ec4899'];

export function PieChart({ children, height = 220 }: { children: ReactNode; width?: number; height?: number }) {
  const [ref, w] = useMeasuredWidth();
  const h = height;

  // Extract Pie props from children
  const parts = extractChildren(children, ['Pie']);
  const pieProps = parts.Pie[0];

  if (!pieProps) return <div ref={ref} style={{ width: '100%', height: h }} />;

  const pieData: ChartData[] = pieProps.data ?? [];
  const dataKey = pieProps.dataKey ?? 'value';
  const nameKey = pieProps.nameKey ?? 'name';
  const outerRadius = pieProps.outerRadius ?? 80;
  const showLabel = pieProps.label !== false;

  // Extract Cell colors
  const cellColors = (React.Children.toArray(pieProps.children))
    .filter((c) => React.isValidElement(c) && (c as any).type?.displayName === 'Cell')
    .map((c) => (c as any).props?.fill);

  const total = pieData.reduce((s, d) => s + Number(d[dataKey] ?? 0), 0);

  const cx = w / 2;
  const cy = h / 2;
  const r = outerRadius;

  let angle = -Math.PI / 2;
  const slices = pieData.map((d, i) => {
    const value = Number(d[dataKey] ?? 0);
    const frac = total > 0 ? value / total : 0;
    const sa = angle;
    const ea = angle + frac * Math.PI * 2;
    angle = ea;
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const large = frac > 0.5 ? 1 : 0;
    const path = frac >= 1 ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const color = cellColors[i] ?? PIE_COLORS[i % PIE_COLORS.length];
    const midA = (sa + ea) / 2;
    const labelX = cx + (r + 14) * Math.cos(midA);
    const labelY = cy + (r + 14) * Math.sin(midA);
    const labelText = typeof pieProps.label === 'function' ? pieProps({ [nameKey]: d[nameKey] }) : String(d[nameKey] ?? '');
    return { path, color, labelX, labelY, labelText, name: d[nameKey], value, i };
  });

  return (
    <div ref={ref} style={{ width: '100%', height: h }}>
      {w > 0 && (
        <svg width={w} height={h} style={{ display: 'block' }}>
          {slices.map((s) => (
            <g key={s.i}>
              <path d={s.path} fill={s.color} stroke="rgba(0,0,0,0.2)" strokeWidth={1}>
                <title>{`${s.name}: ${s.value}`}</title>
              </path>
              {showLabel && (
                <text x={s.labelX} y={s.labelY} fontSize={10} fill="#94a3b8" textAnchor="middle">{s.labelText}</text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
