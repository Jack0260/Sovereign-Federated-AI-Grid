export type Region = 'EU' | 'India' | 'US' | 'UK' | 'Singapore';
export type Regulation = 'GDPR' | 'DPDP' | 'HIPAA' | 'PDPA' | 'UK-GDPR';

export interface Organization {
  id: string;
  name: string;
  type: 'hospital' | 'bank' | 'tech' | 'research' | 'insurance';
  region: Region;
  regulation: Regulation;
  dataSize: number;
  computeCapacity: number;
  joinedAt: number;
  enclaveId: string;
  status: 'active' | 'idle' | 'suspended';
}

export interface Enclave {
  id: string;
  orgId: string;
  isolationLevel: 'confidential' | 'secure' | 'standard';
  attestationHash: string;
  memoryMB: number;
  status: 'sealed' | 'open' | 'compromised';
}

export type RoundPhase = 'initializing' | 'local_training' | 'gradient_collection' | 'aggregation' | 'distribution' | 'completed' | 'failed';

export interface TrainingRound {
  id: string;
  roundNumber: number;
  phase: RoundPhase;
  startedAt: number;
  completedAt: number | null;
  participatingOrgs: string[];
  globalLoss: number;
  previousLoss: number | null;
  gradientNorm: number;
  orgMetrics: Record<string, OrgRoundMetric>;
  modelVersionId: string | null;
  proofIds: string[];
}

export interface OrgRoundMetric {
  orgId: string;
  localLoss: number;
  localAccuracy: number;
  gradientNorm: number;
  samplesProcessed: number;
  computeTimeMs: number;
  status: 'training' | 'submitted' | 'aggregated' | 'failed';
}

export interface ModelWeights {
  version: string;
  shape: number[];
  gradientHash: string;
  norm: number;
  bias: number;
}

export interface FederationConfig {
  algorithm: 'FedAvg' | 'FedProx' | 'FedSGD';
  rounds: number;
  minOrgsPerRound: number;
  learningRate: number;
  aggregationStrategy: 'weighted' | 'uniform';
}

export interface EdgeInferenceRequest {
  id: string;
  orgId: string;
  modelVersionId: string;
  inputSize: number;
  outputSize: number;
  latencyMs: number;
  edgeLocation: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
}
