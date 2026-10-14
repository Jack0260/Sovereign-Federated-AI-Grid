export type PolicyCategory = 'data_sovereignty' | 'cross_border_transfer' | 'retention' | 'anonymization' | 'purpose_limitation' | 'access_control';
export type PolicyStatus = 'active' | 'draft' | 'deprecated' | 'pending_approval';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface DataContract {
  id: string;
  name: string;
  version: string;
  orgId: string;
  regulation: string;
  category: PolicyCategory;
  rules: ContractRule[];
  status: PolicyStatus;
  createdAt: number;
  updatedAt: number;
  approvedBy: string | null;
}

export interface ContractRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: string | number | string[];
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  orgId: string | null;
}

export interface Approval {
  id: string;
  type: 'policy_change' | 'training_round' | 'model_deploy' | 'cross_border_transfer';
  description: string;
  requestedBy: string;
  requestedAt: number;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: number | null;
  resourceId: string;
  orgId: string | null;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  category: PolicyCategory;
  rules: ContractRule[];
  status: PolicyStatus;
  version: string;
  effectiveDate: number;
}
