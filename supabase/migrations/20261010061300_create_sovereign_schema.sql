/*
# SOVEREIGN: Federated AI Grid — Full Database Schema

1. Purpose
   This migration creates the complete database schema for SOVEREIGN, a federated
   AI grid simulation. The app has no sign-in screen (single-tenant), so all
   policies use `TO anon, authenticated` to allow the anon-key frontend to read
   and write its own data.

2. New Tables (19 total)
   - `organizations` — Federated data nodes (hospitals, banks, etc.)
   - `enclaves` — Confidential compute isolation per org
   - `training_rounds` — Federated training round records with per-org metrics
   - `zk_proofs` — Zero-knowledge proof objects
   - `proof_ledger` — Immutable hash-chain ledger of proof events
   - `data_contracts` — Sovereignty rule contracts per org/regulation
   - `governance_policies` — Global governance policies
   - `audit_events` — Chronological audit trail
   - `approvals` — Human-in-the-loop approval queue
   - `compute_listings` — GPU/TPU marketplace listings
   - `compute_orders` — Buy orders placed on listings
   - `model_versions` — Versioned, signed model registry
   - `invoices` — Billing records per org per round
   - `token_ledger` — Compute credit transactions
   - `carbon_reports` — Carbon emissions per round per org
   - `compliance_artifacts` — Auto-generated compliance reports
   - `cross_border_transfers` — Transfer requests and their outcomes
   - `regulation_rules` — Reference table of regulatory requirements
   - `inference_requests` — Edge inference request log

3. Security
   - RLS enabled on ALL tables.
   - All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
     because this is a single-tenant app with no sign-in screen. The data is
     intentionally shared/public.

4. Notes
   - JSONB columns store complex nested objects (org metrics, contract rules, etc.)
   - All timestamps use `timestamptz DEFAULT now()`
   - UUIDs are text-typed to match the frontend's string-based ID generation
*/

-- ============ organizations ============
CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'hospital',
  region text NOT NULL DEFAULT 'EU',
  regulation text NOT NULL DEFAULT 'GDPR',
  data_size bigint NOT NULL DEFAULT 0,
  compute_capacity integer NOT NULL DEFAULT 100,
  joined_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  enclave_id text,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "org_delete" ON organizations;
CREATE POLICY "org_delete" ON organizations FOR DELETE TO anon, authenticated USING (true);

-- ============ enclaves ============
CREATE TABLE IF NOT EXISTS enclaves (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  isolation_level text NOT NULL DEFAULT 'confidential',
  attestation_hash text NOT NULL,
  memory_mb integer NOT NULL DEFAULT 1024,
  status text NOT NULL DEFAULT 'sealed'
);

ALTER TABLE enclaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enclave_select" ON enclaves;
CREATE POLICY "enclave_select" ON enclaves FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "enclave_insert" ON enclaves;
CREATE POLICY "enclave_insert" ON enclaves FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "enclave_update" ON enclaves;
CREATE POLICY "enclave_update" ON enclaves FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "enclave_delete" ON enclaves;
CREATE POLICY "enclave_delete" ON enclaves FOR DELETE TO anon, authenticated USING (true);

-- ============ training_rounds ============
CREATE TABLE IF NOT EXISTS training_rounds (
  id text PRIMARY KEY,
  round_number integer NOT NULL,
  phase text NOT NULL DEFAULT 'initializing',
  started_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  completed_at bigint,
  participating_orgs text[] NOT NULL DEFAULT '{}',
  global_loss double precision NOT NULL DEFAULT 2.302,
  previous_loss double precision,
  gradient_norm double precision NOT NULL DEFAULT 0,
  org_metrics jsonb NOT NULL DEFAULT '{}',
  model_version_id text,
  proof_ids text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE training_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "round_select" ON training_rounds;
CREATE POLICY "round_select" ON training_rounds FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "round_insert" ON training_rounds;
CREATE POLICY "round_insert" ON training_rounds FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "round_update" ON training_rounds;
CREATE POLICY "round_update" ON training_rounds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "round_delete" ON training_rounds;
CREATE POLICY "round_delete" ON training_rounds FOR DELETE TO anon, authenticated USING (true);

-- ============ zk_proofs ============
CREATE TABLE IF NOT EXISTS zk_proofs (
  id text PRIMARY KEY,
  round_id text NOT NULL,
  org_id text NOT NULL,
  type text NOT NULL DEFAULT 'training_honesty',
  status text NOT NULL DEFAULT 'generated',
  commitment text NOT NULL,
  nullifier text NOT NULL,
  proof_hash text NOT NULL,
  public_inputs jsonb NOT NULL DEFAULT '{}',
  private_inputs_hash text NOT NULL,
  generated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  verified_at bigint,
  verifier_id text
);

ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proof_select" ON zk_proofs;
CREATE POLICY "proof_select" ON zk_proofs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "proof_insert" ON zk_proofs;
CREATE POLICY "proof_insert" ON zk_proofs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "proof_update" ON zk_proofs;
CREATE POLICY "proof_update" ON zk_proofs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "proof_delete" ON zk_proofs;
CREATE POLICY "proof_delete" ON zk_proofs FOR DELETE TO anon, authenticated USING (true);

-- ============ proof_ledger ============
CREATE TABLE IF NOT EXISTS proof_ledger (
  id text PRIMARY KEY,
  proof_id text NOT NULL,
  org_id text NOT NULL,
  round_id text NOT NULL,
  action text NOT NULL,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  block_hash text NOT NULL,
  previous_hash text
);

ALTER TABLE proof_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ledger_select" ON proof_ledger;
CREATE POLICY "ledger_select" ON proof_ledger FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ledger_insert" ON proof_ledger;
CREATE POLICY "ledger_insert" ON proof_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ledger_update" ON proof_ledger;
CREATE POLICY "ledger_update" ON proof_ledger FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ledger_delete" ON proof_ledger;
CREATE POLICY "ledger_delete" ON proof_ledger FOR DELETE TO anon, authenticated USING (true);

-- ============ data_contracts ============
CREATE TABLE IF NOT EXISTS data_contracts (
  id text PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  org_id text NOT NULL,
  regulation text NOT NULL,
  category text NOT NULL DEFAULT 'data_sovereignty',
  rules jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft',
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  approved_by text
);

ALTER TABLE data_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contract_select" ON data_contracts;
CREATE POLICY "contract_select" ON data_contracts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "contract_insert" ON data_contracts;
CREATE POLICY "contract_insert" ON data_contracts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "contract_update" ON data_contracts;
CREATE POLICY "contract_update" ON data_contracts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "contract_delete" ON data_contracts;
CREATE POLICY "contract_delete" ON data_contracts FOR DELETE TO anon, authenticated USING (true);

-- ============ governance_policies ============
CREATE TABLE IF NOT EXISTS governance_policies (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  rules jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'active',
  version text NOT NULL,
  effective_date bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE governance_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "policy_select" ON governance_policies;
CREATE POLICY "policy_select" ON governance_policies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "policy_insert" ON governance_policies;
CREATE POLICY "policy_insert" ON governance_policies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "policy_update" ON governance_policies;
CREATE POLICY "policy_update" ON governance_policies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "policy_delete" ON governance_policies;
CREATE POLICY "policy_delete" ON governance_policies FOR DELETE TO anon, authenticated USING (true);

-- ============ audit_events ============
CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  actor text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text NOT NULL,
  details text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  org_id text
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_select" ON audit_events;
CREATE POLICY "audit_select" ON audit_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "audit_insert" ON audit_events;
CREATE POLICY "audit_insert" ON audit_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "audit_update" ON audit_events;
CREATE POLICY "audit_update" ON audit_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "audit_delete" ON audit_events;
CREATE POLICY "audit_delete" ON audit_events FOR DELETE TO anon, authenticated USING (true);

-- ============ approvals ============
CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  type text NOT NULL,
  description text NOT NULL,
  requested_by text NOT NULL,
  requested_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  status text NOT NULL DEFAULT 'pending',
  decided_by text,
  decided_at bigint,
  resource_id text NOT NULL,
  org_id text
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "approval_select" ON approvals;
CREATE POLICY "approval_select" ON approvals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "approval_insert" ON approvals;
CREATE POLICY "approval_insert" ON approvals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "approval_update" ON approvals;
CREATE POLICY "approval_update" ON approvals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "approval_delete" ON approvals;
CREATE POLICY "approval_delete" ON approvals FOR DELETE TO anon, authenticated USING (true);

-- ============ compute_listings ============
CREATE TABLE IF NOT EXISTS compute_listings (
  id text PRIMARY KEY,
  provider_id text NOT NULL,
  provider_name text NOT NULL,
  compute_type text NOT NULL,
  model text NOT NULL,
  region text NOT NULL,
  price_per_hour double precision NOT NULL,
  carbon_intensity double precision NOT NULL,
  energy_source text NOT NULL,
  availability text NOT NULL DEFAULT 'available',
  total_hours integer NOT NULL DEFAULT 0,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE compute_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listing_select" ON compute_listings;
CREATE POLICY "listing_select" ON compute_listings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "listing_insert" ON compute_listings;
CREATE POLICY "listing_insert" ON compute_listings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "listing_update" ON compute_listings;
CREATE POLICY "listing_update" ON compute_listings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "listing_delete" ON compute_listings;
CREATE POLICY "listing_delete" ON compute_listings FOR DELETE TO anon, authenticated USING (true);

-- ============ compute_orders ============
CREATE TABLE IF NOT EXISTS compute_orders (
  id text PRIMARY KEY,
  listing_id text NOT NULL,
  org_id text NOT NULL,
  side text NOT NULL DEFAULT 'buy',
  compute_type text NOT NULL,
  hours double precision NOT NULL,
  price_per_hour double precision NOT NULL,
  total_cost double precision NOT NULL,
  carbon_estimate double precision NOT NULL,
  energy_source text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  matched_at bigint,
  scheduled_slot jsonb
);

ALTER TABLE compute_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_select" ON compute_orders;
CREATE POLICY "order_select" ON compute_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "order_insert" ON compute_orders;
CREATE POLICY "order_insert" ON compute_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "order_update" ON compute_orders;
CREATE POLICY "order_update" ON compute_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "order_delete" ON compute_orders;
CREATE POLICY "order_delete" ON compute_orders FOR DELETE TO anon, authenticated USING (true);

-- ============ model_versions ============
CREATE TABLE IF NOT EXISTS model_versions (
  id text PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  parent_version_id text,
  status text NOT NULL DEFAULT 'trained',
  round_id text,
  org_contributions jsonb NOT NULL DEFAULT '{}',
  weights_hash text NOT NULL,
  signature text NOT NULL DEFAULT '',
  signed_by text NOT NULL DEFAULT '',
  signed_at bigint NOT NULL DEFAULT 0,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  metrics jsonb NOT NULL DEFAULT '{}',
  size double precision NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT ''
);

ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "model_select" ON model_versions;
CREATE POLICY "model_select" ON model_versions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "model_insert" ON model_versions;
CREATE POLICY "model_insert" ON model_versions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "model_update" ON model_versions;
CREATE POLICY "model_update" ON model_versions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "model_delete" ON model_versions;
CREATE POLICY "model_delete" ON model_versions FOR DELETE TO anon, authenticated USING (true);

-- ============ invoices ============
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  round_id text,
  compute_cost double precision NOT NULL DEFAULT 0,
  carbon_cost double precision NOT NULL DEFAULT 0,
  token_cost integer NOT NULL DEFAULT 0,
  total_cost double precision NOT NULL DEFAULT 0,
  carbon_kg double precision NOT NULL DEFAULT 0,
  energy_source text NOT NULL DEFAULT 'solar',
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  paid boolean NOT NULL DEFAULT true
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_select" ON invoices;
CREATE POLICY "invoice_select" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "invoice_insert" ON invoices;
CREATE POLICY "invoice_insert" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "invoice_update" ON invoices;
CREATE POLICY "invoice_update" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "invoice_delete" ON invoices;
CREATE POLICY "invoice_delete" ON invoices FOR DELETE TO anon, authenticated USING (true);

-- ============ token_ledger ============
CREATE TABLE IF NOT EXISTS token_ledger (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  type text NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "token_select" ON token_ledger;
CREATE POLICY "token_select" ON token_ledger FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "token_insert" ON token_ledger;
CREATE POLICY "token_insert" ON token_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "token_update" ON token_ledger;
CREATE POLICY "token_update" ON token_ledger FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "token_delete" ON token_ledger;
CREATE POLICY "token_delete" ON token_ledger FOR DELETE TO anon, authenticated USING (true);

-- ============ carbon_reports ============
CREATE TABLE IF NOT EXISTS carbon_reports (
  id text PRIMARY KEY,
  round_id text NOT NULL,
  org_id text NOT NULL,
  carbon_kg double precision NOT NULL,
  energy_source text NOT NULL,
  carbon_intensity double precision NOT NULL,
  compute_hours double precision NOT NULL,
  region text NOT NULL,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE carbon_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "carbon_select" ON carbon_reports;
CREATE POLICY "carbon_select" ON carbon_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "carbon_insert" ON carbon_reports;
CREATE POLICY "carbon_insert" ON carbon_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "carbon_update" ON carbon_reports;
CREATE POLICY "carbon_update" ON carbon_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "carbon_delete" ON carbon_reports;
CREATE POLICY "carbon_delete" ON carbon_reports FOR DELETE TO anon, authenticated USING (true);

-- ============ compliance_artifacts ============
CREATE TABLE IF NOT EXISTS compliance_artifacts (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  regulation text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  generated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  verified boolean NOT NULL DEFAULT true,
  round_id text
);

ALTER TABLE compliance_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "artifact_select" ON compliance_artifacts;
CREATE POLICY "artifact_select" ON compliance_artifacts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "artifact_insert" ON compliance_artifacts;
CREATE POLICY "artifact_insert" ON compliance_artifacts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "artifact_update" ON compliance_artifacts;
CREATE POLICY "artifact_update" ON compliance_artifacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "artifact_delete" ON compliance_artifacts;
CREATE POLICY "artifact_delete" ON compliance_artifacts FOR DELETE TO anon, authenticated USING (true);

-- ============ cross_border_transfers ============
CREATE TABLE IF NOT EXISTS cross_border_transfers (
  id text PRIMARY KEY,
  from_org_id text NOT NULL,
  to_org_id text NOT NULL,
  from_region text NOT NULL,
  to_region text NOT NULL,
  data_types text[] NOT NULL DEFAULT '{}',
  regulation_applicable text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  reason text NOT NULL DEFAULT ''
);

ALTER TABLE cross_border_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transfer_select" ON cross_border_transfers;
CREATE POLICY "transfer_select" ON cross_border_transfers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "transfer_insert" ON cross_border_transfers;
CREATE POLICY "transfer_insert" ON cross_border_transfers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "transfer_update" ON cross_border_transfers;
CREATE POLICY "transfer_update" ON cross_border_transfers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "transfer_delete" ON cross_border_transfers;
CREATE POLICY "transfer_delete" ON cross_border_transfers FOR DELETE TO anon, authenticated USING (true);

-- ============ regulation_rules ============
CREATE TABLE IF NOT EXISTS regulation_rules (
  id text PRIMARY KEY,
  regulation text NOT NULL,
  region text NOT NULL,
  rule text NOT NULL,
  description text NOT NULL,
  requirement text NOT NULL,
  automated_check boolean NOT NULL DEFAULT true
);

ALTER TABLE regulation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "regrule_select" ON regulation_rules;
CREATE POLICY "regrule_select" ON regulation_rules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "regrule_insert" ON regulation_rules;
CREATE POLICY "regrule_insert" ON regulation_rules FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "regrule_update" ON regulation_rules;
CREATE POLICY "regrule_update" ON regulation_rules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "regrule_delete" ON regulation_rules;
CREATE POLICY "regrule_delete" ON regulation_rules FOR DELETE TO anon, authenticated USING (true);

-- ============ inference_requests ============
CREATE TABLE IF NOT EXISTS inference_requests (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  model_version_id text NOT NULL,
  input_size integer NOT NULL,
  output_size integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  edge_location text NOT NULL,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  status text NOT NULL DEFAULT 'success'
);

ALTER TABLE inference_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inference_select" ON inference_requests;
CREATE POLICY "inference_select" ON inference_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "inference_insert" ON inference_requests;
CREATE POLICY "inference_insert" ON inference_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "inference_update" ON inference_requests;
CREATE POLICY "inference_update" ON inference_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "inference_delete" ON inference_requests;
CREATE POLICY "inference_delete" ON inference_requests FOR DELETE TO anon, authenticated USING (true);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_rounds_round_number ON training_rounds(round_number);
CREATE INDEX IF NOT EXISTS idx_proofs_round_id ON zk_proofs(round_id);
CREATE INDEX IF NOT EXISTS idx_proofs_org_id ON zk_proofs(org_id);
CREATE INDEX IF NOT EXISTS idx_ledger_proof_id ON proof_ledger(proof_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON data_contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON compute_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_models_status ON model_versions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_tokens_org_id ON token_ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_carbon_round_id ON carbon_reports(round_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_org_id ON compliance_artifacts(org_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_org ON cross_border_transfers(from_org_id);
