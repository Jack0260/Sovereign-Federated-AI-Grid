import type {
  Organization,
  Enclave,
  DataContract,
  GovernancePolicy,
  ComputeListing,
  ModelVersion,
  TokenLedgerEntry,
  AuditEvent,
  RegulationRule,
  Approval,
  CarbonForecast,
} from '@/types';
import { uid } from './format';
import { randomHash } from './crypto';

const NOW = Date.now();

export const SEED_ORGS: Organization[] = [
  {
    id: 'org-a',
    name: 'Mercy Hospital Network',
    type: 'hospital',
    region: 'EU',
    regulation: 'GDPR',
    dataSize: 2_400_000,
    computeCapacity: 120,
    joinedAt: NOW - 86400000 * 30,
    enclaveId: 'enc-a',
    status: 'active',
  },
  {
    id: 'org-b',
    name: 'Reserve Bank of India',
    type: 'bank',
    region: 'India',
    regulation: 'DPDP',
    dataSize: 5_800_000,
    computeCapacity: 200,
    joinedAt: NOW - 86400000 * 25,
    enclaveId: 'enc-b',
    status: 'active',
  },
  {
    id: 'org-c',
    name: 'MedTech Solutions Inc',
    type: 'tech',
    region: 'US',
    regulation: 'HIPAA',
    dataSize: 3_100_000,
    computeCapacity: 350,
    joinedAt: NOW - 86400000 * 20,
    enclaveId: 'enc-c',
    status: 'active',
  },
  {
    id: 'org-d',
    name: 'Cambridge Research Institute',
    type: 'research',
    region: 'UK',
    regulation: 'UK-GDPR',
    dataSize: 1_200_000,
    computeCapacity: 80,
    joinedAt: NOW - 86400000 * 15,
    enclaveId: 'enc-d',
    status: 'active',
  },
  {
    id: 'org-e',
    name: 'Asia Pacific Insurance',
    type: 'insurance',
    region: 'Singapore',
    regulation: 'PDPA',
    dataSize: 4_500_000,
    computeCapacity: 150,
    joinedAt: NOW - 86400000 * 10,
    enclaveId: 'enc-e',
    status: 'active',
  },
];

export const SEED_ENCLAVES: Enclave[] = SEED_ORGS.map((org) => ({
  id: org.enclaveId,
  orgId: org.id,
  isolationLevel: 'confidential',
  attestationHash: randomHash(16),
  memoryMB: org.computeCapacity * 16,
  status: 'sealed',
}));

export const SEED_CONTRACTS: DataContract[] = [
  {
    id: 'contract-a',
    name: 'EU Health Data Sovereignty',
    version: '1.2.0',
    orgId: 'org-a',
    regulation: 'GDPR',
    category: 'data_sovereignty',
    status: 'active',
    createdAt: NOW - 86400000 * 28,
    updatedAt: NOW - 86400000 * 5,
    approvedBy: 'governance-council',
    rules: [
      {
        id: 'rule-a1',
        field: 'cross_border',
        operator: 'equals',
        value: 'false',
        description: 'Raw patient data must not leave EU jurisdiction',
        severity: 'critical',
      },
      {
        id: 'rule-a2',
        field: 'retention_days',
        operator: 'less_than',
        value: 30,
        description: 'Gradients must be discarded within 30 days',
        severity: 'high',
      },
      {
        id: 'rule-a3',
        field: 'anonymization',
        operator: 'equals',
        value: 'differential_privacy',
        description: 'DP noise must be applied to all gradients',
        severity: 'high',
      },
    ],
  },
  {
    id: 'contract-b',
    name: 'India Financial Data Protection',
    version: '2.0.1',
    orgId: 'org-b',
    regulation: 'DPDP',
    category: 'cross_border_transfer',
    status: 'active',
    createdAt: NOW - 86400000 * 24,
    updatedAt: NOW - 86400000 * 3,
    approvedBy: 'governance-council',
    rules: [
      {
        id: 'rule-b1',
        field: 'data_localization',
        operator: 'equals',
        value: 'true',
        description: 'Financial data must remain on Indian soil',
        severity: 'critical',
      },
      {
        id: 'rule-b2',
        field: 'consent_required',
        operator: 'equals',
        value: 'true',
        description: 'Explicit consent required for model training',
        severity: 'high',
      },
    ],
  },
  {
    id: 'contract-c',
    name: 'US Healthcare Privacy (HIPAA)',
    version: '1.5.0',
    orgId: 'org-c',
    regulation: 'HIPAA',
    category: 'access_control',
    status: 'active',
    createdAt: NOW - 86400000 * 18,
    updatedAt: NOW - 86400000 * 2,
    approvedBy: 'governance-council',
    rules: [
      {
        id: 'rule-c1',
        field: 'phi_access',
        operator: 'equals',
        value: 'limited',
        description: 'PHI access restricted to authorized enclave processes',
        severity: 'critical',
      },
      {
        id: 'rule-c2',
        field: 'audit_log',
        operator: 'equals',
        value: 'true',
        description: 'All model accesses must be audited',
        severity: 'high',
      },
      {
        id: 'rule-c3',
        field: 'encryption_at_rest',
        operator: 'equals',
        value: 'AES-256',
        description: 'Data at rest must be AES-256 encrypted',
        severity: 'critical',
      },
    ],
  },
];

export const SEED_POLICIES: GovernancePolicy[] = [
  {
    id: 'policy-1',
    name: 'Global Gradient Retention Policy',
    category: 'retention',
    version: '1.0.0',
    status: 'active',
    effectiveDate: NOW - 86400000 * 20,
    rules: [
      {
        id: 'p1-r1',
        field: 'max_retention_hours',
        operator: 'less_than',
        value: 72,
        description: 'Gradients must be purged within 72 hours of round completion',
        severity: 'high',
      },
    ],
  },
  {
    id: 'policy-2',
    name: 'Minimum Org Participation',
    category: 'access_control',
    version: '1.1.0',
    status: 'active',
    effectiveDate: NOW - 86400000 * 18,
    rules: [
      {
        id: 'p2-r1',
        field: 'min_orgs',
        operator: 'greater_than',
        value: 2,
        description: 'At least 3 organizations must participate in each round',
        severity: 'critical',
      },
    ],
  },
];

export const SEED_LISTINGS: ComputeListing[] = [
  { id: 'list-1', providerId: 'provider-1', providerName: 'Nordic Green Compute', computeType: 'GPU', model: 'A100 x8', region: 'EU', pricePerHour: 2.10, carbonIntensity: 0.04, energySource: 'hydro', availability: 'available', totalHours: 720, createdAt: NOW - 3600000 },
  { id: 'list-2', providerId: 'provider-2', providerName: 'Desert Solar Farms', computeType: 'GPU', model: 'H100 x16', region: 'India', pricePerHour: 1.85, carbonIntensity: 0.05, energySource: 'solar', availability: 'available', totalHours: 480, createdAt: NOW - 3600000 * 2 },
  { id: 'list-3', providerId: 'provider-3', providerName: 'Texas Wind Cluster', computeType: 'TPU', model: 'TPU v4 Pod', region: 'US', pricePerHour: 3.90, carbonIntensity: 0.03, energySource: 'wind', availability: 'available', totalHours: 360, createdAt: NOW - 3600000 * 3 },
  { id: 'list-4', providerId: 'provider-4', providerName: 'London Nuclear Grid', computeType: 'GPU', model: 'A100 x4', region: 'UK', pricePerHour: 2.80, carbonIntensity: 0.02, energySource: 'nuclear', availability: 'available', totalHours: 600, createdAt: NOW - 3600000 * 4 },
  { id: 'list-5', providerId: 'provider-5', providerName: 'Pacific Hydro Electric', computeType: 'TPU', model: 'TPU v5 Pod', region: 'Singapore', pricePerHour: 4.20, carbonIntensity: 0.05, energySource: 'hydro', availability: 'available', totalHours: 240, createdAt: NOW - 3600000 * 5 },
  { id: 'list-6', providerId: 'provider-6', providerName: 'Coal Creek Computing', computeType: 'GPU', model: 'V100 x8', region: 'US', pricePerHour: 1.20, carbonIntensity: 0.82, energySource: 'coal', availability: 'available', totalHours: 1000, createdAt: NOW - 3600000 * 6 },
  { id: 'list-7', providerId: 'provider-7', providerName: 'Gas Turbine Computing', computeType: 'CPU-cluster', model: 'EPYC 9654 x64', region: 'EU', pricePerHour: 0.65, carbonIntensity: 0.45, energySource: 'natural_gas', availability: 'available', totalHours: 2000, createdAt: NOW - 3600000 * 7 },
];

export const SEED_CARBON_FORECAST: CarbonForecast[] = Array.from({ length: 24 }, (_, i) => {
  const hour = (new Date().getHours() + i) % 24;
  const solarMW = hour >= 6 && hour <= 18 ? Math.max(0, 50 + Math.sin(((hour - 6) / 12) * Math.PI) * 80 + (Math.random() - 0.5) * 15) : Math.random() * 5;
  const windMW = 30 + Math.random() * 60;
  const hydroMW = 40 + Math.random() * 20;
  const renewableTotal = solarMW + windMW + hydroMW;
  const totalDemand = 200 + Math.random() * 50;
  const carbonIntensity = Math.max(0.02, (1 - renewableTotal / totalDemand) * 0.6);
  return {
    timestamp: NOW + i * 3600000,
    region: 'global',
    solarMW: Math.round(solarMW),
    windMW: Math.round(windMW),
    hydroMW: Math.round(hydroMW),
    carbonIntensity: Math.round(carbonIntensity * 100) / 100,
    recommendedSlot: carbonIntensity < 0.15,
  };
});

export const SEED_MODEL_VERSIONS: ModelVersion[] = [
  {
    id: 'model-v0.1.0',
    name: 'SOVEREIGN-Base',
    version: '0.1.0',
    parentVersionId: null,
    status: 'archived',
    roundId: null,
    orgContributions: {},
    weightsHash: randomHash(16),
    signature: randomHash(16),
    signedBy: 'system',
    signedAt: NOW - 86400000 * 28,
    createdAt: NOW - 86400000 * 28,
    metrics: { accuracy: 0.0, loss: 2.302, f1Score: 0.0, precision: 0.0, recall: 0.0 },
    size: 45.2,
    description: 'Initial base model with random weights',
  },
  {
    id: 'model-v0.2.0',
    name: 'SOVEREIGN-Base',
    version: '0.2.0',
    parentVersionId: 'model-v0.1.0',
    status: 'archived',
    roundId: 'seed-round-1',
    orgContributions: { 'org-a': 0.3, 'org-b': 0.25, 'org-c': 0.45 },
    weightsHash: randomHash(16),
    signature: randomHash(16),
    signedBy: 'governance-council',
    signedAt: NOW - 86400000 * 20,
    createdAt: NOW - 86400000 * 20,
    metrics: { accuracy: 0.72, loss: 0.85, f1Score: 0.70, precision: 0.74, recall: 0.68 },
    size: 45.3,
    description: 'After 5 federated rounds with 3 orgs',
  },
  {
    id: 'model-v0.3.0',
    name: 'SOVEREIGN-Base',
    version: '0.3.0',
    parentVersionId: 'model-v0.2.0',
    status: 'deployed',
    roundId: 'seed-round-2',
    orgContributions: { 'org-a': 0.22, 'org-b': 0.28, 'org-c': 0.30, 'org-d': 0.12, 'org-e': 0.08 },
    weightsHash: randomHash(16),
    signature: randomHash(16),
    signedBy: 'governance-council',
    signedAt: NOW - 86400000 * 5,
    createdAt: NOW - 86400000 * 5,
    metrics: { accuracy: 0.87, loss: 0.32, f1Score: 0.86, precision: 0.88, recall: 0.85 },
    size: 45.8,
    description: 'After 12 federated rounds with 5 orgs, carbon-optimized',
  },
];

export const SEED_TOKEN_LEDGER: TokenLedgerEntry[] = SEED_ORGS.map((org, i) => ({
  id: uid('ledger-'),
  orgId: org.id,
  type: 'credit',
  amount: 10000 - i * 500,
  reason: 'Initial compute credit allocation',
  balanceAfter: 10000 - i * 500,
  timestamp: org.joinedAt,
}));

export const SEED_AUDIT_EVENTS: AuditEvent[] = [
  { id: uid('audit-'), timestamp: NOW - 86400000 * 28, actor: 'system', action: 'ORG_JOINED', resource: 'organization', resourceId: 'org-a', details: 'Mercy Hospital Network joined the federation', severity: 'info', orgId: 'org-a' },
  { id: uid('audit-'), timestamp: NOW - 86400000 * 25, actor: 'system', action: 'ORG_JOINED', resource: 'organization', resourceId: 'org-b', details: 'Reserve Bank of India joined the federation', severity: 'info', orgId: 'org-b' },
  { id: uid('audit-'), timestamp: NOW - 86400000 * 20, actor: 'governance-council', action: 'MODEL_SIGNED', resource: 'model', resourceId: 'model-v0.2.0', details: 'Model v0.2.0 signed and deployed', severity: 'info', orgId: null },
  { id: uid('audit-'), timestamp: NOW - 86400000 * 10, actor: 'system', action: 'CONTRACT_APPROVED', resource: 'data_contract', resourceId: 'contract-c', details: 'HIPAA compliance contract approved for MedTech Solutions', severity: 'info', orgId: 'org-c' },
  { id: uid('audit-'), timestamp: NOW - 86400000 * 5, actor: 'governance-council', action: 'MODEL_DEPLOYED', resource: 'model', resourceId: 'model-v0.3.0', details: 'Model v0.3.0 deployed to edge endpoints', severity: 'info', orgId: null },
  { id: uid('audit-'), timestamp: NOW - 3600000 * 3, actor: 'system', action: 'CROSS_BORDER_BLOCKED', resource: 'transfer', resourceId: uid('xfer-'), details: 'Cross-border gradient transfer blocked: GDPR data_sovereignty violation', severity: 'warning', orgId: 'org-a' },
];

export const SEED_APPROVALS: Approval[] = [
  {
    id: uid('appr-'),
    type: 'policy_change',
    description: 'Propose reducing gradient retention from 72h to 48h',
    requestedBy: 'org-a',
    requestedAt: NOW - 3600000 * 12,
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    resourceId: 'policy-1',
    orgId: 'org-a',
  },
  {
    id: uid('appr-'),
    type: 'cross_border_transfer',
    description: 'Request to share anonymized model metrics with org-d (UK)',
    requestedBy: 'org-c',
    requestedAt: NOW - 3600000 * 6,
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    resourceId: uid('xfer-'),
    orgId: 'org-c',
  },
];

export const SEED_REGULATION_RULES: RegulationRule[] = [
  { id: 'reg-1', regulation: 'GDPR', region: 'EU', rule: 'Article 44', description: 'Cross-border data transfer requires adequacy decision', requirement: 'Verify recipient country has adequate data protection laws', automatedCheck: true },
  { id: 'reg-2', regulation: 'GDPR', region: 'EU', rule: 'Article 22', description: 'Automated decision-making safeguards', requirement: 'Human review capability for model decisions affecting individuals', automatedCheck: true },
  { id: 'reg-3', regulation: 'DPDP', region: 'India', rule: 'Section 16', description: 'Data localization for sensitive personal data', requirement: 'Sensitive data must be stored and processed only in India', automatedCheck: true },
  { id: 'reg-4', regulation: 'HIPAA', region: 'US', rule: '164.312(a)(1)', description: 'Access control for ePHI', requirement: 'Technical safeguards for electronic protected health information', automatedCheck: true },
  { id: 'reg-5', regulation: 'HIPAA', region: 'US', rule: '164.308(b)', description: 'Audit controls', requirement: 'Hardware, software, and procedural mechanisms to record and examine access', automatedCheck: true },
  { id: 'reg-6', regulation: 'UK-GDPR', region: 'UK', rule: 'Schedule 21', description: 'International transfers post-Brexit', requirement: 'Transfer impact assessment required for non-UK recipients', automatedCheck: true },
  { id: 'reg-7', regulation: 'PDPA', region: 'Singapore', rule: 'Part 5', description: 'Transfer of personal data outside Singapore', requirement: 'Comparable protection standard in receiving country', automatedCheck: true },
];
