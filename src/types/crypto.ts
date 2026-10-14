export type ProofType = 'training_honesty' | 'gradient_integrity' | 'data_sovereignty' | 'model_lineage';
export type ProofStatus = 'generated' | 'verified' | 'challenged' | 'invalid';

export interface ZKProof {
  id: string;
  roundId: string;
  orgId: string;
  type: ProofType;
  status: ProofStatus;
  commitment: string;
  nullifier: string;
  proofHash: string;
  publicInputs: Record<string, string | number>;
  privateInputsHash: string;
  generatedAt: number;
  verifiedAt: number | null;
  verifierId: string | null;
}

export interface ProofCommitment {
  hash: string;
  algorithm: 'SHA-256';
  salt: string;
  data: string;
}

export interface LedgerEntry {
  id: string;
  proofId: string;
  orgId: string;
  roundId: string;
  action: 'proof_generated' | 'proof_verified' | 'proof_challenged' | 'proof_invalidated';
  timestamp: number;
  blockHash: string;
  previousHash: string | null;
}

export interface ProofChallenge {
  id: string;
  proofId: string;
  challengerId: string;
  reason: string;
  timestamp: number;
  resolved: boolean;
  outcome: 'upheld' | 'rejected' | 'pending';
}
