import { supabase } from '@/lib/supabase';
import type {
  Organization,
  Enclave,
  DataContract,
  GovernancePolicy,
  AuditEvent,
  Approval,
  ComputeListing,
  ModelVersion,
  TokenLedgerEntry,
  RegulationRule,
} from '@/types';

interface DBState {
  orgs: Organization[];
  enclaves: Enclave[];
  contracts: DataContract[];
  policies: GovernancePolicy[];
  auditEvents: AuditEvent[];
  approvals: Approval[];
  listings: ComputeListing[];
  models: ModelVersion[];
  tokenLedger: TokenLedgerEntry[];
  regulationRules: RegulationRule[];
}

export async function loadFromDB(): Promise<DBState | null> {
  try {
    const [
      orgsRes, enclavesRes, contractsRes, policiesRes,
      auditRes, approvalsRes, listingsRes, modelsRes,
      tokensRes, regRulesRes,
    ] = await Promise.all([
      supabase.from('organizations').select('*').order('joined_at'),
      supabase.from('enclaves').select('*'),
      supabase.from('data_contracts').select('*').order('created_at'),
      supabase.from('governance_policies').select('*').order('effective_date'),
      supabase.from('audit_events').select('*').order('timestamp', { ascending: false }).limit(500),
      supabase.from('approvals').select('*').order('requested_at', { ascending: false }),
      supabase.from('compute_listings').select('*').order('created_at'),
      supabase.from('model_versions').select('*').order('created_at', { ascending: false }),
      supabase.from('token_ledger').select('*').order('timestamp'),
      supabase.from('regulation_rules').select('*'),
    ]);

    if (orgsRes.error || enclavesRes.error || contractsRes.error || policiesRes.error ||
        auditRes.error || approvalsRes.error || listingsRes.error || modelsRes.error ||
        tokensRes.error || regRulesRes.error) {
      console.error('DB load error:', orgsRes.error || enclavesRes.error || contractsRes.error);
      return null;
    }

    return {
      orgs: (orgsRes.data ?? []).map(mapOrg),
      enclaves: (enclavesRes.data ?? []).map(mapEnclave),
      contracts: (contractsRes.data ?? []).map(mapContract),
      policies: (policiesRes.data ?? []).map(mapPolicy),
      auditEvents: (auditRes.data ?? []).map(mapAudit),
      approvals: (approvalsRes.data ?? []).map(mapApproval),
      listings: (listingsRes.data ?? []).map(mapListing),
      models: (modelsRes.data ?? []).map(mapModel),
      tokenLedger: (tokensRes.data ?? []).map(mapToken),
      regulationRules: (regRulesRes.data ?? []).map(mapRegRule),
    };
  } catch (err) {
    console.error('Failed to load from DB:', err);
    return null;
  }
}

export async function persistAuditEvent(event: {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  resource: string;
  resource_id: string;
  details: string;
  severity: string;
  org_id: string | null;
}): Promise<void> {
  try {
    await supabase.from('audit_events').upsert(event);
  } catch (err) {
    console.error('Failed to persist audit event:', err);
  }
}

export async function persistModel(model: ModelVersion): Promise<void> {
  try {
    await supabase.from('model_versions').upsert({
      id: model.id,
      name: model.name,
      version: model.version,
      parent_version_id: model.parentVersionId,
      status: model.status,
      round_id: model.roundId,
      org_contributions: model.orgContributions,
      weights_hash: model.weightsHash,
      signature: model.signature,
      signed_by: model.signedBy,
      signed_at: model.signedAt,
      created_at: model.createdAt,
      metrics: model.metrics,
      size: model.size,
      description: model.description,
    });
  } catch (err) {
    console.error('Failed to persist model:', err);
  }
}

export async function persistOrder(order: {
  id: string;
  listing_id: string;
  org_id: string;
  side: string;
  compute_type: string;
  hours: number;
  price_per_hour: number;
  total_cost: number;
  carbon_estimate: number;
  energy_source: string;
  status: string;
  created_at: number;
  matched_at: number | null;
  scheduled_slot: unknown;
}): Promise<void> {
  try {
    await supabase.from('compute_orders').upsert(order);
  } catch (err) {
    console.error('Failed to persist order:', err);
  }
}

export async function persistInvoice(invoice: {
  id: string;
  org_id: string;
  round_id: string | null;
  compute_cost: number;
  carbon_cost: number;
  token_cost: number;
  total_cost: number;
  carbon_kg: number;
  energy_source: string;
  timestamp: number;
  paid: boolean;
}): Promise<void> {
  try {
    await supabase.from('invoices').upsert(invoice);
  } catch (err) {
    console.error('Failed to persist invoice:', err);
  }
}

export async function persistTokenEntry(entry: {
  id: string;
  org_id: string;
  type: string;
  amount: number;
  reason: string;
  balance_after: number;
  timestamp: number;
}): Promise<void> {
  try {
    await supabase.from('token_ledger').upsert(entry);
  } catch (err) {
    console.error('Failed to persist token entry:', err);
  }
}

export async function persistCarbonReport(report: {
  id: string;
  round_id: string;
  org_id: string;
  carbon_kg: number;
  energy_source: string;
  carbon_intensity: number;
  compute_hours: number;
  region: string;
  timestamp: number;
}): Promise<void> {
  try {
    await supabase.from('carbon_reports').upsert(report);
  } catch (err) {
    console.error('Failed to persist carbon report:', err);
  }
}

export async function persistComplianceArtifact(artifact: {
  id: string;
  org_id: string;
  regulation: string;
  type: string;
  title: string;
  content: string;
  generated_at: number;
  verified: boolean;
  round_id: string | null;
}): Promise<void> {
  try {
    await supabase.from('compliance_artifacts').upsert(artifact);
  } catch (err) {
    console.error('Failed to persist compliance artifact:', err);
  }
}

export async function persistCrossBorderTransfer(transfer: {
  id: string;
  from_org_id: string;
  to_org_id: string;
  from_region: string;
  to_region: string;
  data_types: string[];
  regulation_applicable: string;
  status: string;
  timestamp: number;
  reason: string;
}): Promise<void> {
  try {
    await supabase.from('cross_border_transfers').upsert(transfer);
  } catch (err) {
    console.error('Failed to persist transfer:', err);
  }
}

export async function persistInferenceRequest(req: {
  id: string;
  org_id: string;
  model_version_id: string;
  input_size: number;
  output_size: number;
  latency_ms: number;
  edge_location: string;
  timestamp: number;
  status: string;
}): Promise<void> {
  try {
    await supabase.from('inference_requests').upsert(req);
  } catch (err) {
    console.error('Failed to persist inference request:', err);
  }
}

export async function updateListingAvailability(listingId: string, availability: string, totalHours: number): Promise<void> {
  try {
    await supabase.from('compute_listings').update({ availability, total_hours: totalHours }).eq('id', listingId);
  } catch (err) {
    console.error('Failed to update listing:', err);
  }
}

// ============ Mappers (snake_case DB -> camelCase TS) ============

function mapOrg(r: Record<string, unknown>): Organization {
  return {
    id: r.id as string,
    name: r.name as string,
    type: r.type as Organization['type'],
    region: r.region as Organization['region'],
    regulation: r.regulation as Organization['regulation'],
    dataSize: r.data_size as number,
    computeCapacity: r.compute_capacity as number,
    joinedAt: r.joined_at as number,
    enclaveId: r.enclave_id as string,
    status: r.status as Organization['status'],
  };
}

function mapEnclave(r: Record<string, unknown>): Enclave {
  return {
    id: r.id as string,
    orgId: r.org_id as string,
    isolationLevel: r.isolation_level as Enclave['isolationLevel'],
    attestationHash: r.attestation_hash as string,
    memoryMB: r.memory_mb as number,
    status: r.status as Enclave['status'],
  };
}

function mapContract(r: Record<string, unknown>): DataContract {
  return {
    id: r.id as string,
    name: r.name as string,
    version: r.version as string,
    orgId: r.org_id as string,
    regulation: r.regulation as string,
    category: r.category as DataContract['category'],
    rules: r.rules as DataContract['rules'],
    status: r.status as DataContract['status'],
    createdAt: r.created_at as number,
    updatedAt: r.updated_at as number,
    approvedBy: r.approved_by as string | null,
  };
}

function mapPolicy(r: Record<string, unknown>): GovernancePolicy {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as GovernancePolicy['category'],
    rules: r.rules as GovernancePolicy['rules'],
    status: r.status as GovernancePolicy['status'],
    version: r.version as string,
    effectiveDate: r.effective_date as number,
  };
}

function mapAudit(r: Record<string, unknown>): AuditEvent {
  return {
    id: r.id as string,
    timestamp: r.timestamp as number,
    actor: r.actor as string,
    action: r.action as string,
    resource: r.resource as string,
    resourceId: r.resource_id as string,
    details: r.details as string,
    severity: r.severity as AuditEvent['severity'],
    orgId: r.org_id as string | null,
  };
}

function mapApproval(r: Record<string, unknown>): Approval {
  return {
    id: r.id as string,
    type: r.type as Approval['type'],
    description: r.description as string,
    requestedBy: r.requested_by as string,
    requestedAt: r.requested_at as number,
    status: r.status as Approval['status'],
    decidedBy: r.decided_by as string | null,
    decidedAt: r.decided_at as number | null,
    resourceId: r.resource_id as string,
    orgId: r.org_id as string | null,
  };
}

function mapListing(r: Record<string, unknown>): ComputeListing {
  return {
    id: r.id as string,
    providerId: r.provider_id as string,
    providerName: r.provider_name as string,
    computeType: r.compute_type as ComputeListing['computeType'],
    model: r.model as string,
    region: r.region as string,
    pricePerHour: r.price_per_hour as number,
    carbonIntensity: r.carbon_intensity as number,
    energySource: r.energy_source as ComputeListing['energySource'],
    availability: r.availability as ComputeListing['availability'],
    totalHours: r.total_hours as number,
    createdAt: r.created_at as number,
  };
}

function mapModel(r: Record<string, unknown>): ModelVersion {
  return {
    id: r.id as string,
    name: r.name as string,
    version: r.version as string,
    parentVersionId: r.parent_version_id as string | null,
    status: r.status as ModelVersion['status'],
    roundId: r.round_id as string | null,
    orgContributions: r.org_contributions as Record<string, number>,
    weightsHash: r.weights_hash as string,
    signature: r.signature as string,
    signedBy: r.signed_by as string,
    signedAt: r.signed_at as number,
    createdAt: r.created_at as number,
    metrics: r.metrics as ModelVersion['metrics'],
    size: r.size as number,
    description: r.description as string,
  };
}

function mapToken(r: Record<string, unknown>): TokenLedgerEntry {
  return {
    id: r.id as string,
    orgId: r.org_id as string,
    type: r.type as TokenLedgerEntry['type'],
    amount: r.amount as number,
    reason: r.reason as string,
    balanceAfter: r.balance_after as number,
    timestamp: r.timestamp as number,
  };
}

function mapRegRule(r: Record<string, unknown>): RegulationRule {
  return {
    id: r.id as string,
    regulation: r.regulation as string,
    region: r.region as string,
    rule: r.rule as string,
    description: r.description as string,
    requirement: r.requirement as string,
    automatedCheck: r.automated_check as boolean,
  };
}
