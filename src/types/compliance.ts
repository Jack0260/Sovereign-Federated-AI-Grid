export interface RegulationRule {
  id: string;
  regulation: string;
  region: string;
  rule: string;
  description: string;
  requirement: string;
  automatedCheck: boolean;
}

export interface ComplianceArtifact {
  id: string;
  orgId: string;
  regulation: string;
  type: 'audit_report' | 'data_flow_map' | 'consent_record' | 'retention_policy' | 'impact_assessment';
  title: string;
  content: string;
  generatedAt: number;
  verified: boolean;
  roundId: string | null;
}

export interface ComplianceStatus {
  orgId: string;
  regulation: string;
  region: string;
  status: 'compliant' | 'warning' | 'non_compliant' | 'pending_review';
  lastChecked: number;
  issues: string[];
  artifactsGenerated: number;
}

export interface CrossBorderTransfer {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  fromRegion: string;
  toRegion: string;
  dataTypes: string[];
  regulationApplicable: string;
  status: 'approved' | 'blocked' | 'pending' | 'requires_review';
  timestamp: number;
  reason: string;
}
