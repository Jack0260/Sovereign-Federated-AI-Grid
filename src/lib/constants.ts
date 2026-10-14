import type { Region, Regulation, EnergySource, ComputeType } from '@/types';

export const ORG_TYPES = {
  hospital: { label: 'Hospital', icon: 'Hospital', color: 'error' },
  bank: { label: 'Bank', icon: 'Building2', color: 'warning' },
  tech: { label: 'Tech Corp', icon: 'Cpu', color: 'accent' },
  research: { label: 'Research', icon: 'FlaskConical', color: 'primary' },
  insurance: { label: 'Insurance', icon: 'ShieldCheck', color: 'secondary' },
} as const;

export const REGION_REGULATIONS: Record<Region, Regulation> = {
  EU: 'GDPR',
  India: 'DPDP',
  US: 'HIPAA',
  UK: 'UK-GDPR',
  Singapore: 'PDPA',
};

export const REGULATION_INFO: Record<Regulation, { fullName: string; region: Region; color: string }> = {
  GDPR: { fullName: 'General Data Protection Regulation', region: 'EU', color: 'primary' },
  DPDP: { fullName: 'Digital Personal Data Protection Act', region: 'India', color: 'warning' },
  HIPAA: { fullName: 'Health Insurance Portability and Accountability Act', region: 'US', color: 'error' },
  'UK-GDPR': { fullName: 'UK General Data Protection Regulation', region: 'UK', color: 'accent' },
  PDPA: { fullName: 'Personal Data Protection Act', region: 'Singapore', color: 'secondary' },
};

export const ENERGY_SOURCE_INFO: Record<EnergySource, { label: string; color: string; carbonIntensity: number; isGreen: boolean }> = {
  solar: { label: 'Solar', color: 'warning', carbonIntensity: 0.04, isGreen: true },
  wind: { label: 'Wind', color: 'accent', carbonIntensity: 0.03, isGreen: true },
  hydro: { label: 'Hydro', color: 'primary', carbonIntensity: 0.05, isGreen: true },
  nuclear: { label: 'Nuclear', color: 'secondary', carbonIntensity: 0.02, isGreen: true },
  natural_gas: { label: 'Natural Gas', color: 'warning', carbonIntensity: 0.45, isGreen: false },
  coal: { label: 'Coal', color: 'error', carbonIntensity: 0.82, isGreen: false },
};

export const COMPUTE_TYPE_INFO: Record<ComputeType, { label: string; basePrice: number; tFlops: number }> = {
  GPU: { label: 'GPU Cluster', basePrice: 2.5, tFlops: 40 },
  TPU: { label: 'TPU Pod', basePrice: 4.5, tFlops: 100 },
  'CPU-cluster': { label: 'CPU Cluster', basePrice: 0.8, tFlops: 5 },
};

export const ROUND_PHASES = {
  initializing: { label: 'Initializing', color: 'secondary', step: 0 },
  local_training: { label: 'Local Training', color: 'accent', step: 1 },
  gradient_collection: { label: 'Gradient Collection', color: 'warning', step: 2 },
  aggregation: { label: 'Aggregation', color: 'primary', step: 3 },
  distribution: { label: 'Distribution', color: 'primary', step: 4 },
  completed: { label: 'Completed', color: 'success', step: 5 },
  failed: { label: 'Failed', color: 'error', step: 5 },
} as const;

export const NAV_ITEMS = [
  { id: 'overview', label: 'Command Center', icon: 'LayoutDashboard' },
  { id: 'federation', label: 'Federation Runtime', icon: 'Network' },
  { id: 'crypto', label: 'Crypto Proofs', icon: 'KeyRound' },
  { id: 'governance', label: 'Governance', icon: 'Scale' },
  { id: 'marketplace', label: 'Compute Market', icon: 'ShoppingCart' },
  { id: 'registry', label: 'Model Registry', icon: 'GitBranch' },
  { id: 'economics', label: 'Economics', icon: 'TrendingUp' },
  { id: 'inference', label: 'Edge Inference', icon: 'Zap' },
  { id: 'compliance', label: 'Compliance', icon: 'FileCheck' },
] as const;

export type PageId = (typeof NAV_ITEMS)[number]['id'];

export const COLORS = {
  primary: '#10b981',
  accent: '#06b6d4',
  warning: '#f59e0b',
  error: '#f43f5e',
  success: '#22c55e',
  secondary: '#64748b',
};
