import { useSyncExternalStore } from 'react';
import type {
  Organization,
  Enclave,
  TrainingRound,
  OrgRoundMetric,
  ZKProof,
  LedgerEntry,
  DataContract,
  GovernancePolicy,
  AuditEvent,
  Approval,
  ComputeListing,
  ComputeOrder,
  CarbonForecast,
  CarbonSlot,
  ModelVersion,
  Invoice,
  TokenLedgerEntry,
  CarbonReport,
  ComplianceArtifact,
  ComplianceStatus,
  CrossBorderTransfer,
  RegulationRule,
} from '@/types';
import type { EdgeInferenceRequest } from '@/types/federation';
import {
  SEED_ORGS,
  SEED_ENCLAVES,
  SEED_CONTRACTS,
  SEED_POLICIES,
  SEED_LISTINGS,
  SEED_CARBON_FORECAST,
  SEED_MODEL_VERSIONS,
  SEED_TOKEN_LEDGER,
  SEED_AUDIT_EVENTS,
  SEED_APPROVALS,
  SEED_REGULATION_RULES,
} from '@/lib/seedData';
import { uid, randomBetween, randomInt, clamp } from '@/lib/format';
import { sha256, randomHash } from '@/lib/crypto';
import { ENERGY_SOURCE_INFO } from '@/lib/constants';
import {
  loadFromDB, persistAuditEvent, persistModel, persistOrder,
  persistInvoice, persistTokenEntry, persistCarbonReport,
  persistComplianceArtifact, persistCrossBorderTransfer,
  persistInferenceRequest, updateListingAvailability,
} from '@/lib/dbSync';

type ThemeMode = 'dark' | 'light';

interface SovereignState {
  theme: ThemeMode;
  orgs: Organization[];
  enclaves: Enclave[];
  rounds: TrainingRound[];
  currentRoundId: string | null;
  federationConfig: {
    algorithm: 'FedAvg' | 'FedProx' | 'FedSGD';
    rounds: number;
    minOrgsPerRound: number;
    learningRate: number;
    aggregationStrategy: 'weighted' | 'uniform';
  };
  isTraining: boolean;
  proofs: ZKProof[];
  ledger: LedgerEntry[];
  proofChallenges: { id: string; proofId: string; challengerId: string; reason: string; timestamp: number; resolved: boolean; outcome: 'upheld' | 'rejected' | 'pending' }[];
  contracts: DataContract[];
  policies: GovernancePolicy[];
  auditEvents: AuditEvent[];
  approvals: Approval[];
  listings: ComputeListing[];
  orders: ComputeOrder[];
  carbonForecast: CarbonForecast[];
  models: ModelVersion[];
  invoices: Invoice[];
  tokenLedger: TokenLedgerEntry[];
  carbonReports: CarbonReport[];
  regulationRules: RegulationRule[];
  complianceArtifacts: ComplianceArtifact[];
  crossBorderTransfers: CrossBorderTransfer[];
  inferenceRequests: EdgeInferenceRequest[];

  toggleTheme: () => void;
  startTrainingRound: () => Promise<void>;
  advanceRound: () => Promise<void>;
  resetFederation: () => void;
  generateProof: (orgId: string, roundId: string, gradientHash: string) => Promise<void>;
  verifyProof: (proofId: string) => Promise<void>;
  challengeProof: (proofId: string, reason: string) => void;
  createContract: (contract: Omit<DataContract, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateContract: (id: string, rules: DataContract['rules']) => void;
  approveContract: (id: string, approver: string) => void;
  approveItem: (id: string, approver: string) => void;
  rejectItem: (id: string, approver: string) => void;
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  placeOrder: (listingId: string, orgId: string, hours: number) => void;
  cancelOrder: (orderId: string) => void;
  signModel: (modelId: string, signerId: string, signerOrgId: string) => Promise<void>;
  deployModel: (modelId: string) => void;
  generateComplianceArtifact: (orgId: string, regulation: string, type: ComplianceArtifact['type']) => void;
  requestCrossBorderTransfer: (fromOrgId: string, toOrgId: string, dataTypes: string[]) => void;
  runEdgeInference: (orgId: string, modelVersionId: string, inputSize: number) => void;
  loadFromDB: () => Promise<void>;
}

function generateOrgMetrics(orgIds: string[], orgs: Organization[]): Record<string, OrgRoundMetric> {
  const result: Record<string, OrgRoundMetric> = {};
  for (const orgId of orgIds) {
    const org = orgs.find((o) => o.id === orgId);
    const capacity = org?.computeCapacity ?? 100;
    result[orgId] = {
      orgId,
      localLoss: randomBetween(0.3, 1.5),
      localAccuracy: randomBetween(0.65, 0.92),
      gradientNorm: randomBetween(0.01, 0.15),
      samplesProcessed: randomInt(1000, 5000),
      computeTimeMs: randomInt(2000, 15000),
      status: 'training',
    };
  }
  return result;
}

function computeGlobalLoss(metrics: Record<string, OrgRoundMetric>): number {
  const losses = Object.values(metrics).map((m) => m.localLoss);
  return losses.reduce((a, b) => a + b, 0) / losses.length;
}

function pickGreenListing(listings: ComputeListing[]): ComputeListing | null {
  const green = listings.filter((l) => l.availability === 'available' && ENERGY_SOURCE_INFO[l.energySource].isGreen);
  if (green.length === 0) return listings[0] ?? null;
  green.sort((a, b) => a.carbonIntensity - b.carbonIntensity);
  return green[0];
}

let simulationTimeout: ReturnType<typeof setTimeout> | null = null;

function createInitialState(): SovereignState {
  let state: SovereignState = {
    theme: 'dark',
    orgs: SEED_ORGS,
    enclaves: SEED_ENCLAVES,
    rounds: [],
    currentRoundId: null,
    federationConfig: {
      algorithm: 'FedAvg',
      rounds: 20,
      minOrgsPerRound: 3,
      learningRate: 0.01,
      aggregationStrategy: 'weighted',
    },
    isTraining: false,
    proofs: [],
    ledger: [],
    proofChallenges: [],
    contracts: SEED_CONTRACTS,
    policies: SEED_POLICIES,
    auditEvents: SEED_AUDIT_EVENTS,
    approvals: SEED_APPROVALS,
    listings: SEED_LISTINGS,
    orders: [],
    carbonForecast: SEED_CARBON_FORECAST,
    models: SEED_MODEL_VERSIONS,
    invoices: [],
    tokenLedger: SEED_TOKEN_LEDGER,
    carbonReports: [],
    regulationRules: SEED_REGULATION_RULES,
    complianceArtifacts: [],
    crossBorderTransfers: [],
    inferenceRequests: [],

    toggleTheme: () => store.setState((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

    startTrainingRound: async () => {
      const s = store.getState();
      if (s.isTraining) return;
      const activeOrgs = s.orgs.filter((o) => o.status === 'active');
      if (activeOrgs.length < s.federationConfig.minOrgsPerRound) return;
      const lastRound = s.rounds.length > 0 ? Math.max(...s.rounds.map((r) => r.roundNumber)) : 0;
      const previousRound = s.rounds.find((r) => r.roundNumber === lastRound);
      const participatingOrgs = activeOrgs.map((o) => o.id);
      const roundId = uid('round-');
      const round: TrainingRound = {
        id: roundId,
        roundNumber: lastRound + 1,
        phase: 'initializing',
        startedAt: Date.now(),
        completedAt: null,
        participatingOrgs,
        globalLoss: previousRound?.globalLoss ?? 2.302,
        previousLoss: previousRound?.globalLoss ?? null,
        gradientNorm: 0,
        orgMetrics: generateOrgMetrics(participatingOrgs, activeOrgs),
        modelVersionId: null,
        proofIds: [],
      };
      store.setState({ isTraining: true, currentRoundId: roundId, rounds: [...s.rounds, round] });
      store.getState().addAuditEvent({
        actor: 'system', action: 'ROUND_STARTED', resource: 'training_round', resourceId: roundId,
        details: `Federated training round ${round.roundNumber} started with ${participatingOrgs.length} organizations`,
        severity: 'info', orgId: null,
      });
      simulationTimeout = setTimeout(() => store.getState().advanceRound(), 1500);
    },

    advanceRound: async () => {
      const s = store.getState();
      if (!s.currentRoundId) return;
      const round = s.rounds.find((r) => r.id === s.currentRoundId);
      if (!round) return;
      const phases: TrainingRound['phase'][] = ['initializing', 'local_training', 'gradient_collection', 'aggregation', 'distribution', 'completed'];
      const currentIdx = phases.indexOf(round.phase);
      if (currentIdx >= phases.length - 1) {
        store.setState({ isTraining: false, currentRoundId: null });
        return;
      }
      const nextPhase = phases[currentIdx + 1];
      const updatedMetrics = { ...round.orgMetrics };
      if (nextPhase === 'local_training') {
        for (const orgId of round.participatingOrgs) {
          updatedMetrics[orgId] = {
            ...updatedMetrics[orgId],
            status: 'training',
            localLoss: clamp(updatedMetrics[orgId].localLoss * randomBetween(0.85, 0.98), 0.05, 3.0),
            localAccuracy: clamp(updatedMetrics[orgId].localAccuracy * randomBetween(1.0, 1.03), 0.5, 0.99),
            gradientNorm: randomBetween(0.005, 0.12),
          };
        }
      }
      if (nextPhase === 'gradient_collection') {
        for (const orgId of round.participatingOrgs) updatedMetrics[orgId] = { ...updatedMetrics[orgId], status: 'submitted' };
      }
      if (nextPhase === 'aggregation') {
        for (const orgId of round.participatingOrgs) updatedMetrics[orgId] = { ...updatedMetrics[orgId], status: 'aggregated' };
      }
      const newGlobalLoss = nextPhase === 'aggregation' || nextPhase === 'distribution' || nextPhase === 'completed'
        ? clamp(computeGlobalLoss(updatedMetrics) * randomBetween(0.92, 0.99), 0.01, 3.0) : round.globalLoss;
      const updatedRound: TrainingRound = {
        ...round, phase: nextPhase, orgMetrics: updatedMetrics, globalLoss: newGlobalLoss,
        gradientNorm: Object.values(updatedMetrics).reduce((sum, m) => sum + m.gradientNorm, 0),
        completedAt: nextPhase === 'completed' ? Date.now() : null,
      };
      store.setState({ rounds: s.rounds.map((r) => (r.id === round.id ? updatedRound : r)) });

      if (nextPhase === 'gradient_collection') {
        for (const orgId of round.participatingOrgs) {
          const gradientHash = randomHash(16);
          await store.getState().generateProof(orgId, round.id, gradientHash);
        }
      }

      if (nextPhase === 'completed') {
        const sAfter = store.getState();
        const latestModel = sAfter.models[0];
        const newVersion = `0.${Math.floor(Math.random() * 100)}.${randomInt(0, 9)}`;
        const modelVersion: ModelVersion = {
          id: uid('model-'), name: 'SOVEREIGN-Base', version: newVersion,
          parentVersionId: latestModel?.id ?? null, status: 'trained', roundId: round.id,
          orgContributions: Object.fromEntries(round.participatingOrgs.map((oid) => [oid, 1 / round.participatingOrgs.length])),
          weightsHash: randomHash(16), signature: '', signedBy: '', signedAt: 0, createdAt: Date.now(),
          metrics: {
            accuracy: clamp(1 - newGlobalLoss * 0.3, 0.5, 0.99), loss: newGlobalLoss,
            f1Score: clamp(1 - newGlobalLoss * 0.35, 0.5, 0.98), precision: clamp(1 - newGlobalLoss * 0.28, 0.5, 0.99),
            recall: clamp(1 - newGlobalLoss * 0.32, 0.5, 0.98),
          },
          size: 45 + randomBetween(0, 2),
          description: `Federated model after round ${round.roundNumber} with ${round.participatingOrgs.length} orgs`,
        };
        store.setState({ models: [modelVersion, ...sAfter.models] });
        persistModel(modelVersion);
        const greenListing = pickGreenListing(sAfter.listings);
        const orgIds = round.participatingOrgs;
        const newInvoices: Invoice[] = [];
        const newCarbonReports: CarbonReport[] = [];
        for (const orgId of orgIds) {
          const org = sAfter.orgs.find((o) => o.id === orgId);
          if (!org) continue;
          const metric = round.orgMetrics[orgId];
          const computeHours = metric.computeTimeMs / 3600000;
          const carbonKg = computeHours * (greenListing?.carbonIntensity ?? 0.1) * 10;
          const computeCost = computeHours * (greenListing?.pricePerHour ?? 2.0);
          const carbonCost = carbonKg * 0.05;
          const tokenCost = Math.round(computeCost * 10);
          newInvoices.push({
            id: uid('inv-'), orgId, roundId: round.id, computeCost, carbonCost, tokenCost,
            totalCost: computeCost + carbonCost, carbonKg, energySource: greenListing?.energySource ?? 'solar',
            timestamp: Date.now(), paid: true,
          });
          newCarbonReports.push({
            id: uid('carbon-'), roundId: round.id, orgId, carbonKg,
            energySource: greenListing?.energySource ?? 'solar', carbonIntensity: greenListing?.carbonIntensity ?? 0.05,
            computeHours, region: org.region, timestamp: Date.now(),
          });
          const currentBalance = sAfter.tokenLedger
            .filter((l) => l.orgId === orgId)
            .reduce((sum, l) => (l.type === 'credit' || l.type === 'reward' ? sum + l.amount : sum - l.amount), 0);
          const newLedgerEntry: TokenLedgerEntry = {
            id: uid('ledger-'), orgId, type: 'debit', amount: tokenCost,
            reason: `Round ${round.roundNumber} compute cost`, balanceAfter: currentBalance - tokenCost, timestamp: Date.now(),
          };
          store.setState({ tokenLedger: [...store.getState().tokenLedger, newLedgerEntry] });
          persistTokenEntry({
            id: newLedgerEntry.id, org_id: newLedgerEntry.orgId, type: newLedgerEntry.type,
            amount: newLedgerEntry.amount, reason: newLedgerEntry.reason,
            balance_after: newLedgerEntry.balanceAfter, timestamp: newLedgerEntry.timestamp,
          });
        }
        store.setState({
          invoices: [...store.getState().invoices, ...newInvoices],
          carbonReports: [...store.getState().carbonReports, ...newCarbonReports],
          isTraining: false, currentRoundId: null,
        });
        for (const inv of newInvoices) {
          persistInvoice({
            id: inv.id, org_id: inv.orgId, round_id: inv.roundId, compute_cost: inv.computeCost,
            carbon_cost: inv.carbonCost, token_cost: inv.tokenCost, total_cost: inv.totalCost,
            carbon_kg: inv.carbonKg, energy_source: inv.energySource, timestamp: inv.timestamp, paid: inv.paid,
          });
        }
        for (const cr of newCarbonReports) {
          persistCarbonReport({
            id: cr.id, round_id: cr.roundId, org_id: cr.orgId, carbon_kg: cr.carbonKg,
            energy_source: cr.energySource, carbon_intensity: cr.carbonIntensity,
            compute_hours: cr.computeHours, region: cr.region, timestamp: cr.timestamp,
          });
        }
        store.getState().addAuditEvent({
          actor: 'system', action: 'ROUND_COMPLETED', resource: 'training_round', resourceId: round.id,
          details: `Round ${round.roundNumber} completed. Global loss: ${newGlobalLoss.toFixed(4)}`,
          severity: 'info', orgId: null,
        });
        store.getState().generateComplianceArtifact(round.participatingOrgs[0], 'GDPR', 'audit_report');
        if (simulationTimeout) { clearTimeout(simulationTimeout); simulationTimeout = null; }
        return;
      }
      simulationTimeout = setTimeout(() => store.getState().advanceRound(), 1500);
    },

    resetFederation: () => {
      if (simulationTimeout) { clearTimeout(simulationTimeout); simulationTimeout = null; }
      store.setState({
        rounds: [], currentRoundId: null, isTraining: false, proofs: [], ledger: [], proofChallenges: [],
        invoices: [], carbonReports: [], inferenceRequests: [], complianceArtifacts: [], crossBorderTransfers: [],
        models: SEED_MODEL_VERSIONS, tokenLedger: SEED_TOKEN_LEDGER,
      });
    },

    generateProof: async (orgId, roundId, gradientHash) => {
      const commitment = await sha256(`${orgId}:${roundId}:${gradientHash}:${randomHash(8)}`);
      const nullifier = await sha256(`nullifier:${orgId}:${roundId}:${Date.now()}`);
      const proofHash = await sha256(`${commitment}:${nullifier}:${gradientHash}`);
      const privateInputsHash = await sha256(`${gradientHash}:${randomHash(8)}`);
      const proof: ZKProof = {
        id: uid('proof-'), roundId, orgId, type: 'training_honesty', status: 'generated',
        commitment, nullifier, proofHash,
        publicInputs: { org_id: orgId, round_id: roundId, gradient_norm: randomBetween(0.005, 0.12).toFixed(6), samples: randomInt(1000, 5000) },
        privateInputsHash, generatedAt: Date.now(), verifiedAt: null, verifierId: null,
      };
      const lastLedger = store.getState().ledger[store.getState().ledger.length - 1];
      const blockHash = await sha256(`${proofHash}:${lastLedger?.blockHash ?? 'genesis'}:${Date.now()}`);
      const ledgerEntry: LedgerEntry = {
        id: uid('ledger-'), proofId: proof.id, orgId, roundId, action: 'proof_generated',
        timestamp: Date.now(), blockHash, previousHash: lastLedger?.blockHash ?? null,
      };
      store.setState((s) => ({
        proofs: [...s.proofs, proof], ledger: [...s.ledger, ledgerEntry],
        rounds: s.rounds.map((r) => r.id === roundId ? { ...r, proofIds: [...r.proofIds, proof.id] } : r),
      }));
    },

    verifyProof: async (proofId) => {
      const s = store.getState();
      const proof = s.proofs.find((p) => p.id === proofId);
      if (!proof || proof.status !== 'generated') return;
      const verificationHash = await sha256(`${proof.commitment}:${proof.nullifier}:${proof.proofHash}`);
      const isValid = verificationHash === proof.proofHash || Math.random() > 0.02;
      const lastLedger = s.ledger[s.ledger.length - 1];
      const blockHash = await sha256(`${proof.proofHash}:${lastLedger?.blockHash ?? 'genesis'}:${Date.now()}`);
      const ledgerEntry: LedgerEntry = {
        id: uid('ledger-'), proofId, orgId: proof.orgId, roundId: proof.roundId,
        action: isValid ? 'proof_verified' : 'proof_invalidated',
        timestamp: Date.now(), blockHash, previousHash: lastLedger?.blockHash ?? null,
      };
      store.setState((st) => ({
        proofs: st.proofs.map((p) => p.id === proofId ? { ...p, status: isValid ? 'verified' : 'invalid', verifiedAt: Date.now(), verifierId: 'verifier-1' } : p),
        ledger: [...st.ledger, ledgerEntry],
      }));
      store.getState().addAuditEvent({
        actor: 'verifier-1', action: isValid ? 'PROOF_VERIFIED' : 'PROOF_INVALIDATED',
        resource: 'zk_proof', resourceId: proofId,
        details: `ZK proof for org ${proof.orgId} ${isValid ? 'verified successfully' : 'failed verification'}`,
        severity: isValid ? 'info' : 'critical', orgId: proof.orgId,
      });
    },

    challengeProof: (proofId, reason) => {
      const proof = store.getState().proofs.find((p) => p.id === proofId);
      if (!proof) return;
      store.setState((s) => ({
        proofs: s.proofs.map((p) => (p.id === proofId ? { ...p, status: 'challenged' } : p)),
        proofChallenges: [...s.proofChallenges, { id: uid('challenge-'), proofId, challengerId: 'auditor-1', reason, timestamp: Date.now(), resolved: false, outcome: 'pending' }],
      }));
      store.getState().addAuditEvent({
        actor: 'auditor-1', action: 'PROOF_CHALLENGED', resource: 'zk_proof', resourceId: proofId,
        details: `Proof challenged: ${reason}`, severity: 'warning', orgId: proof.orgId,
      });
    },

    createContract: (contract) => {
      const newContract: DataContract = { ...contract, id: uid('contract-'), status: 'draft', createdAt: Date.now(), updatedAt: Date.now() };
      store.setState((s) => ({ contracts: [...s.contracts, newContract] }));
      store.getState().addAuditEvent({
        actor: contract.orgId, action: 'CONTRACT_CREATED', resource: 'data_contract', resourceId: newContract.id,
        details: `New data contract "${contract.name}" created`, severity: 'info', orgId: contract.orgId,
      });
    },

    updateContract: (id, rules) => {
      store.setState((s) => ({ contracts: s.contracts.map((c) => c.id === id ? { ...c, rules, updatedAt: Date.now() } : c) }));
    },

    approveContract: (id, approver) => {
      store.setState((s) => ({ contracts: s.contracts.map((c) => c.id === id ? { ...c, status: 'active', approvedBy: approver, updatedAt: Date.now() } : c) }));
      const contract = store.getState().contracts.find((c) => c.id === id);
      store.getState().addAuditEvent({
        actor: approver, action: 'CONTRACT_APPROVED', resource: 'data_contract', resourceId: id,
        details: `Data contract "${contract?.name}" approved`, severity: 'info', orgId: contract?.orgId ?? null,
      });
    },

    approveItem: (id, approver) => {
      store.setState((s) => ({ approvals: s.approvals.map((a) => a.id === id ? { ...a, status: 'approved', decidedBy: approver, decidedAt: Date.now() } : a) }));
      const appr = store.getState().approvals.find((a) => a.id === id);
      store.getState().addAuditEvent({
        actor: approver, action: 'APPROVAL_GRANTED', resource: appr?.type ?? 'approval', resourceId: id,
        details: appr?.description ?? 'Approval granted', severity: 'info', orgId: appr?.orgId ?? null,
      });
    },

    rejectItem: (id, approver) => {
      store.setState((s) => ({ approvals: s.approvals.map((a) => a.id === id ? { ...a, status: 'rejected', decidedBy: approver, decidedAt: Date.now() } : a) }));
      const appr = store.getState().approvals.find((a) => a.id === id);
      store.getState().addAuditEvent({
        actor: approver, action: 'APPROVAL_REJECTED', resource: appr?.type ?? 'approval', resourceId: id,
        details: appr?.description ?? 'Approval rejected', severity: 'warning', orgId: appr?.orgId ?? null,
      });
    },

    addAuditEvent: (event) => {
      const newEvent = { ...event, id: uid('audit-'), timestamp: Date.now() };
      store.setState((s) => ({ auditEvents: [newEvent, ...s.auditEvents].slice(0, 500) }));
      persistAuditEvent({
        id: newEvent.id, timestamp: newEvent.timestamp, actor: newEvent.actor, action: newEvent.action,
        resource: newEvent.resource, resource_id: newEvent.resourceId, details: newEvent.details,
        severity: newEvent.severity, org_id: newEvent.orgId,
      });
    },

    placeOrder: (listingId, orgId, hours) => {
      const listing = store.getState().listings.find((l) => l.id === listingId);
      if (!listing) return;
      const carbonEstimate = hours * listing.carbonIntensity * 10;
      const totalCost = hours * listing.pricePerHour;
      const greenSlot: CarbonSlot | null = store.getState().carbonForecast.find((f) => f.recommendedSlot) ? {
        id: uid('slot-'), startTime: Date.now() + 3600000, endTime: Date.now() + 3600000 * hours,
        energySource: listing.energySource, carbonIntensity: listing.carbonIntensity, region: listing.region, available: false,
      } : null;
      const order: ComputeOrder = {
        id: uid('order-'), listingId, orgId, side: 'buy', computeType: listing.computeType, hours,
        pricePerHour: listing.pricePerHour, totalCost, carbonEstimate, energySource: listing.energySource,
        status: 'matched', createdAt: Date.now(), matchedAt: Date.now(), scheduledSlot: greenSlot,
      };
      store.setState((s) => ({
        orders: [...s.orders, order],
        listings: s.listings.map((l) => l.id === listingId ? { ...l, availability: 'reserved', totalHours: l.totalHours - hours } : l),
      }));
      persistOrder({
        id: order.id, listing_id: order.listingId, org_id: order.orgId, side: order.side,
        compute_type: order.computeType, hours: order.hours, price_per_hour: order.pricePerHour,
        total_cost: order.totalCost, carbon_estimate: order.carbonEstimate, energy_source: order.energySource,
        status: order.status, created_at: order.createdAt, matched_at: order.matchedAt, scheduled_slot: order.scheduledSlot,
      });
      updateListingAvailability(listingId, 'reserved', listing.totalHours - hours);
      store.getState().addAuditEvent({
        actor: orgId, action: 'COMPUTE_ORDERED', resource: 'compute_listing', resourceId: listingId,
        details: `${hours}h of ${listing.computeType} from ${listing.providerName} (${listing.energySource})`,
        severity: 'info', orgId,
      });
    },

    cancelOrder: (orderId) => {
      const order = store.getState().orders.find((o) => o.id === orderId);
      if (!order) return;
      store.setState((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)),
        listings: s.listings.map((l) => l.id === order.listingId ? { ...l, availability: 'available', totalHours: l.totalHours + order.hours } : l),
      }));
    },

    signModel: async (modelId, signerId, signerOrgId) => {
      const model = store.getState().models.find((m) => m.id === modelId);
      if (!model) return;
      const signature = await sha256(`${model.weightsHash}:${signerId}:${Date.now()}`);
      store.setState((s) => ({
        models: s.models.map((m) => m.id === modelId ? { ...m, signature, signedBy: signerId, signedAt: Date.now(), status: m.status === 'trained' ? 'trained' : m.status } : m),
      }));
      const signed = store.getState().models.find((m) => m.id === modelId);
      if (signed) persistModel(signed);
      store.getState().addAuditEvent({
        actor: signerId, action: 'MODEL_SIGNED', resource: 'model', resourceId: modelId,
        details: `Model ${model.name} v${model.version} signed by ${signerOrgId}`, severity: 'info', orgId: signerOrgId,
      });
    },

    deployModel: (modelId) => {
      const model = store.getState().models.find((m) => m.id === modelId);
      if (!model || !model.signature) return;
      store.setState((s) => ({ models: s.models.map((m) => (m.id === modelId ? { ...m, status: 'deployed' } : m)) }));
      const deployed = store.getState().models.find((m) => m.id === modelId);
      if (deployed) persistModel(deployed);
      store.getState().addAuditEvent({
        actor: 'governance-council', action: 'MODEL_DEPLOYED', resource: 'model', resourceId: modelId,
        details: `Model ${model.name} v${model.version} deployed to edge endpoints`, severity: 'info', orgId: null,
      });
    },

    generateComplianceArtifact: (orgId, regulation, type) => {
      const org = store.getState().orgs.find((o) => o.id === orgId);
      if (!org) return;
      const titles: Record<ComplianceArtifact['type'], string> = {
        audit_report: 'Automated Audit Report', data_flow_map: 'Data Flow Mapping',
        consent_record: 'Consent Record', retention_policy: 'Data Retention Policy',
        impact_assessment: 'Data Protection Impact Assessment',
      };
      const artifact: ComplianceArtifact = {
        id: uid('artifact-'), orgId, regulation, type, title: titles[type],
        content: `Automatically generated ${titles[type]} for ${org.name} under ${regulation}. Verified: no raw data left jurisdiction, only encrypted gradients transmitted. All training operations executed within confidential compute enclave ${org.enclaveId}.`,
        generatedAt: Date.now(), verified: true, roundId: store.getState().currentRoundId,
      };
      store.setState((s) => ({ complianceArtifacts: [artifact, ...s.complianceArtifacts] }));
      persistComplianceArtifact({
        id: artifact.id, org_id: artifact.orgId, regulation: artifact.regulation, type: artifact.type,
        title: artifact.title, content: artifact.content, generated_at: artifact.generatedAt,
        verified: artifact.verified, round_id: artifact.roundId,
      });
      store.getState().addAuditEvent({
        actor: 'system', action: 'ARTIFACT_GENERATED', resource: 'compliance_artifact', resourceId: artifact.id,
        details: `${titles[type]} generated for ${org.name} (${regulation})`, severity: 'info', orgId,
      });
    },

    requestCrossBorderTransfer: (fromOrgId, toOrgId, dataTypes) => {
      const fromOrg = store.getState().orgs.find((o) => o.id === fromOrgId);
      const toOrg = store.getState().orgs.find((o) => o.id === toOrgId);
      if (!fromOrg || !toOrg) return;
      const contract = store.getState().contracts.find((c) => c.orgId === fromOrgId && c.category === 'cross_border_transfer');
      const blocked = contract?.rules.some((r) => r.field === 'cross_border' && r.value === 'false') ?? false;
      const dataLocalization = contract?.rules.some((r) => r.field === 'data_localization' && r.value === 'true') ?? false;
      let status: CrossBorderTransfer['status'] = 'pending';
      let reason = 'Transfer request submitted for review';
      if (blocked || dataLocalization) {
        status = 'blocked'; reason = `Blocked by ${fromOrg.regulation} sovereignty rules: raw data cannot leave ${fromOrg.region}`;
      } else if (fromOrg.regulation === 'GDPR' && toOrg.region !== 'EU' && toOrg.regulation !== 'UK-GDPR') {
        status = 'requires_review'; reason = `GDPR Article 44: Transfer to ${toOrg.region} requires adequacy assessment`;
      } else { status = 'approved'; reason = `Transfer approved: ${toOrg.regulation} provides comparable protection`; }
      const transfer: CrossBorderTransfer = {
        id: uid('xfer-'), fromOrgId, toOrgId, fromRegion: fromOrg.region, toRegion: toOrg.region,
        dataTypes, regulationApplicable: fromOrg.regulation, status, timestamp: Date.now(), reason,
      };
      store.setState((s) => ({ crossBorderTransfers: [transfer, ...s.crossBorderTransfers] }));
      persistCrossBorderTransfer({
        id: transfer.id, from_org_id: transfer.fromOrgId, to_org_id: transfer.toOrgId,
        from_region: transfer.fromRegion, to_region: transfer.toRegion, data_types: transfer.dataTypes,
        regulation_applicable: transfer.regulationApplicable, status: transfer.status,
        timestamp: transfer.timestamp, reason: transfer.reason,
      });
      store.getState().addAuditEvent({
        actor: fromOrgId, action: status === 'blocked' ? 'CROSS_BORDER_BLOCKED' : 'CROSS_BORDER_REQUESTED',
        resource: 'cross_border_transfer', resourceId: transfer.id, details: reason,
        severity: status === 'blocked' ? 'critical' : status === 'requires_review' ? 'warning' : 'info', orgId: fromOrgId,
      });
    },

    runEdgeInference: (orgId, modelVersionId, inputSize) => {
      const org = store.getState().orgs.find((o) => o.id === orgId);
      const model = store.getState().models.find((m) => m.id === modelVersionId);
      if (!org || !model) return;
      const baseLatency = 5 + inputSize * 0.001;
      const edgeLatency = baseLatency + randomBetween(2, 15);
      const request: EdgeInferenceRequest = {
        id: uid('infer-'), orgId, modelVersionId, inputSize, outputSize: Math.floor(inputSize * 0.1),
        latencyMs: Math.round(edgeLatency), edgeLocation: `${org.region}-edge-01`, timestamp: Date.now(), status: 'success',
      };
      store.setState((s) => ({ inferenceRequests: [request, ...s.inferenceRequests].slice(0, 50) }));
      persistInferenceRequest({
        id: request.id, org_id: request.orgId, model_version_id: request.modelVersionId,
        input_size: request.inputSize, output_size: request.outputSize, latency_ms: request.latencyMs,
        edge_location: request.edgeLocation, timestamp: request.timestamp, status: request.status,
      });
    },

    loadFromDB: async () => {
      const dbState = await loadFromDB();
      if (!dbState) return;
      store.setState({
        orgs: dbState.orgs.length > 0 ? dbState.orgs : SEED_ORGS,
        enclaves: dbState.enclaves.length > 0 ? dbState.enclaves : SEED_ENCLAVES,
        contracts: dbState.contracts.length > 0 ? dbState.contracts : SEED_CONTRACTS,
        policies: dbState.policies.length > 0 ? dbState.policies : SEED_POLICIES,
        auditEvents: dbState.auditEvents.length > 0 ? dbState.auditEvents : SEED_AUDIT_EVENTS,
        approvals: dbState.approvals.length > 0 ? dbState.approvals : SEED_APPROVALS,
        listings: dbState.listings.length > 0 ? dbState.listings : SEED_LISTINGS,
        models: dbState.models.length > 0 ? dbState.models : SEED_MODEL_VERSIONS,
        tokenLedger: dbState.tokenLedger.length > 0 ? dbState.tokenLedger : SEED_TOKEN_LEDGER,
        regulationRules: dbState.regulationRules.length > 0 ? dbState.regulationRules : SEED_REGULATION_RULES,
      });
    },
  };
  return state;
}

type Listener = () => void;
type SetPartial = Partial<SovereignState> | ((s: SovereignState) => Partial<SovereignState>);

const store = {
  _state: createInitialState(),
  _listeners: new Set<Listener>(),
  getState(): SovereignState { return this._state; },
  setState(partial: SetPartial) {
    const next = typeof partial === 'function' ? partial(this._state) : partial;
    this._state = { ...this._state, ...next };
    this._listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  },
};

export function useSovereignStore<T>(selector: (s: SovereignState) => T): T {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
