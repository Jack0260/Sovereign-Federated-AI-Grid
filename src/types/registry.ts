export type ModelStatus = 'training' | 'trained' | 'deployed' | 'archived' | 'deprecated';

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  parentVersionId: string | null;
  status: ModelStatus;
  roundId: string | null;
  orgContributions: Record<string, number>;
  weightsHash: string;
  signature: string;
  signedBy: string;
  signedAt: number;
  createdAt: number;
  metrics: ModelMetrics;
  size: number;
  description: string;
}

export interface ModelMetrics {
  accuracy: number;
  loss: number;
  f1Score: number;
  precision: number;
  recall: number;
}

export interface LineageNode {
  id: string;
  modelVersionId: string;
  label: string;
  parentIds: string[];
  roundNumber: number | null;
  orgCount: number;
  timestamp: number;
}

export interface ModelSignature {
  id: string;
  modelVersionId: string;
  signerId: string;
  signerOrgId: string;
  algorithm: 'Ed25519-mock' | 'HMAC-SHA256';
  signatureHash: string;
  publicKeyHash: string;
  timestamp: number;
  valid: boolean;
}
