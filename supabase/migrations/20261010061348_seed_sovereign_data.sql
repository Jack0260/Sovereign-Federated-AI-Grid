/*
# SOVEREIGN: Seed Initial Data

1. Purpose
   Populates all tables with the initial seed data that matches the frontend's
   seedData.ts: 5 organizations, 5 enclaves, 3 data contracts, 2 governance
   policies, 7 compute listings, 3 model versions, 2 token ledger entries,
   6 audit events, 2 approvals, and 7 regulation rules.

2. Tables populated (10)
   - organizations, enclaves, data_contracts, governance_policies
   - compute_listings, model_versions, token_ledger
   - audit_events, approvals, regulation_rules

3. Notes
   - Uses fixed timestamp values computed from now() to match the app's
     relative time offsets (30 days ago, 25 days ago, etc.)
   - Model version hashes are generated with gen_random_bytes for demo purposes
   - This is idempotent: uses ON CONFLICT DO NOTHING
*/

-- Organizations
INSERT INTO organizations (id, name, type, region, regulation, data_size, compute_capacity, joined_at, enclave_id, status) VALUES
('org-a', 'Mercy Hospital Network', 'hospital', 'EU', 'GDPR', 2400000, 120, (extract(epoch from now()) * 1000)::bigint - 2592000000, 'enc-a', 'active'),
('org-b', 'Reserve Bank of India', 'bank', 'India', 'DPDP', 5800000, 200, (extract(epoch from now()) * 1000)::bigint - 2160000000, 'enc-b', 'active'),
('org-c', 'MedTech Solutions Inc', 'tech', 'US', 'HIPAA', 3100000, 350, (extract(epoch from now()) * 1000)::bigint - 1728000000, 'enc-c', 'active'),
('org-d', 'Cambridge Research Institute', 'research', 'UK', 'UK-GDPR', 1200000, 80, (extract(epoch from now()) * 1000)::bigint - 1296000000, 'enc-d', 'active'),
('org-e', 'Asia Pacific Insurance', 'insurance', 'Singapore', 'PDPA', 4500000, 150, (extract(epoch from now()) * 1000)::bigint - 864000000, 'enc-e', 'active')
ON CONFLICT (id) DO NOTHING;

-- Enclaves
INSERT INTO enclaves (id, org_id, isolation_level, attestation_hash, memory_mb, status) VALUES
('enc-a', 'org-a', 'confidential', encode(gen_random_bytes(16), 'hex'), 1920, 'sealed'),
('enc-b', 'org-b', 'confidential', encode(gen_random_bytes(16), 'hex'), 3200, 'sealed'),
('enc-c', 'org-c', 'confidential', encode(gen_random_bytes(16), 'hex'), 5600, 'sealed'),
('enc-d', 'org-d', 'confidential', encode(gen_random_bytes(16), 'hex'), 1280, 'sealed'),
('enc-e', 'org-e', 'confidential', encode(gen_random_bytes(16), 'hex'), 2400, 'sealed')
ON CONFLICT (id) DO NOTHING;

-- Data Contracts
INSERT INTO data_contracts (id, name, version, org_id, regulation, category, rules, status, created_at, updated_at, approved_by) VALUES
('contract-a', 'EU Health Data Sovereignty', '1.2.0', 'org-a', 'GDPR', 'data_sovereignty',
  '[{"id":"rule-a1","field":"cross_border","operator":"equals","value":"false","description":"Raw patient data must not leave EU jurisdiction","severity":"critical"},{"id":"rule-a2","field":"retention_days","operator":"less_than","value":30,"description":"Gradients must be discarded within 30 days","severity":"high"},{"id":"rule-a3","field":"anonymization","operator":"equals","value":"differential_privacy","description":"DP noise must be applied to all gradients","severity":"high"}]',
  'active', (extract(epoch from now()) * 1000)::bigint - 2419200000, (extract(epoch from now()) * 1000)::bigint - 432000000, 'governance-council'),
('contract-b', 'India Financial Data Protection', '2.0.1', 'org-b', 'DPDP', 'cross_border_transfer',
  '[{"id":"rule-b1","field":"data_localization","operator":"equals","value":"true","description":"Financial data must remain on Indian soil","severity":"critical"},{"id":"rule-b2","field":"consent_required","operator":"equals","value":"true","description":"Explicit consent required for model training","severity":"high"}]',
  'active', (extract(epoch from now()) * 1000)::bigint - 2073600000, (extract(epoch from now()) * 1000)::bigint - 259200000, 'governance-council'),
('contract-c', 'US Healthcare Privacy (HIPAA)', '1.5.0', 'org-c', 'HIPAA', 'access_control',
  '[{"id":"rule-c1","field":"phi_access","operator":"equals","value":"limited","description":"PHI access restricted to authorized enclave processes","severity":"critical"},{"id":"rule-c2","field":"audit_log","operator":"equals","value":"true","description":"All model accesses must be audited","severity":"high"},{"id":"rule-c3","field":"encryption_at_rest","operator":"equals","value":"AES-256","description":"Data at rest must be AES-256 encrypted","severity":"critical"}]',
  'active', (extract(epoch from now()) * 1000)::bigint - 1555200000, (extract(epoch from now()) * 1000)::bigint - 172800000, 'governance-council')
ON CONFLICT (id) DO NOTHING;

-- Governance Policies
INSERT INTO governance_policies (id, name, category, rules, status, version, effective_date) VALUES
('policy-1', 'Global Gradient Retention Policy', 'retention',
  '[{"id":"p1-r1","field":"max_retention_hours","operator":"less_than","value":72,"description":"Gradients must be purged within 72 hours of round completion","severity":"high"}]',
  'active', '1.0.0', (extract(epoch from now()) * 1000)::bigint - 1728000000),
('policy-2', 'Minimum Org Participation', 'access_control',
  '[{"id":"p2-r1","field":"min_orgs","operator":"greater_than","value":2,"description":"At least 3 organizations must participate in each round","severity":"critical"}]',
  'active', '1.1.0', (extract(epoch from now()) * 1000)::bigint - 1555200000)
ON CONFLICT (id) DO NOTHING;

-- Compute Listings
INSERT INTO compute_listings (id, provider_id, provider_name, compute_type, model, region, price_per_hour, carbon_intensity, energy_source, availability, total_hours, created_at) VALUES
('list-1', 'provider-1', 'Nordic Green Compute', 'GPU', 'A100 x8', 'EU', 2.10, 0.04, 'hydro', 'available', 720, (extract(epoch from now()) * 1000)::bigint - 3600000),
('list-2', 'provider-2', 'Desert Solar Farms', 'GPU', 'H100 x16', 'India', 1.85, 0.05, 'solar', 'available', 480, (extract(epoch from now()) * 1000)::bigint - 7200000),
('list-3', 'provider-3', 'Texas Wind Cluster', 'TPU', 'TPU v4 Pod', 'US', 3.90, 0.03, 'wind', 'available', 360, (extract(epoch from now()) * 1000)::bigint - 10800000),
('list-4', 'provider-4', 'London Nuclear Grid', 'GPU', 'A100 x4', 'UK', 2.80, 0.02, 'nuclear', 'available', 600, (extract(epoch from now()) * 1000)::bigint - 14400000),
('list-5', 'provider-5', 'Pacific Hydro Electric', 'TPU', 'TPU v5 Pod', 'Singapore', 4.20, 0.05, 'hydro', 'available', 240, (extract(epoch from now()) * 1000)::bigint - 18000000),
('list-6', 'provider-6', 'Coal Creek Computing', 'GPU', 'V100 x8', 'US', 1.20, 0.82, 'coal', 'available', 1000, (extract(epoch from now()) * 1000)::bigint - 21600000),
('list-7', 'provider-7', 'Gas Turbine Computing', 'CPU-cluster', 'EPYC 9654 x64', 'EU', 0.65, 0.45, 'natural_gas', 'available', 2000, (extract(epoch from now()) * 1000)::bigint - 25200000)
ON CONFLICT (id) DO NOTHING;

-- Model Versions
INSERT INTO model_versions (id, name, version, parent_version_id, status, round_id, org_contributions, weights_hash, signature, signed_by, signed_at, created_at, metrics, size, description) VALUES
('model-v0.1.0', 'SOVEREIGN-Base', '0.1.0', null, 'archived', null, '{}',
  encode(gen_random_bytes(16), 'hex'), encode(gen_random_bytes(16), 'hex'), 'system',
  (extract(epoch from now()) * 1000)::bigint - 2419200000, (extract(epoch from now()) * 1000)::bigint - 2419200000,
  '{"accuracy":0.0,"loss":2.302,"f1Score":0.0,"precision":0.0,"recall":0.0}', 45.2, 'Initial base model with random weights'),
('model-v0.2.0', 'SOVEREIGN-Base', '0.2.0', 'model-v0.1.0', 'archived', 'seed-round-1',
  '{"org-a":0.3,"org-b":0.25,"org-c":0.45}',
  encode(gen_random_bytes(16), 'hex'), encode(gen_random_bytes(16), 'hex'), 'governance-council',
  (extract(epoch from now()) * 1000)::bigint - 1728000000, (extract(epoch from now()) * 1000)::bigint - 1728000000,
  '{"accuracy":0.72,"loss":0.85,"f1Score":0.70,"precision":0.74,"recall":0.68}', 45.3, 'After 5 federated rounds with 3 orgs'),
('model-v0.3.0', 'SOVEREIGN-Base', '0.3.0', 'model-v0.2.0', 'deployed', 'seed-round-2',
  '{"org-a":0.22,"org-b":0.28,"org-c":0.30,"org-d":0.12,"org-e":0.08}',
  encode(gen_random_bytes(16), 'hex'), encode(gen_random_bytes(16), 'hex'), 'governance-council',
  (extract(epoch from now()) * 1000)::bigint - 432000000, (extract(epoch from now()) * 1000)::bigint - 432000000,
  '{"accuracy":0.87,"loss":0.32,"f1Score":0.86,"precision":0.88,"recall":0.85}', 45.8, 'After 12 federated rounds with 5 orgs, carbon-optimized')
ON CONFLICT (id) DO NOTHING;

-- Token Ledger (initial credits)
INSERT INTO token_ledger (id, org_id, type, amount, reason, balance_after, timestamp) VALUES
('token-init-a', 'org-a', 'credit', 10000, 'Initial compute credit allocation', 10000, (extract(epoch from now()) * 1000)::bigint - 2592000000),
('token-init-b', 'org-b', 'credit', 9500, 'Initial compute credit allocation', 9500, (extract(epoch from now()) * 1000)::bigint - 2160000000),
('token-init-c', 'org-c', 'credit', 9000, 'Initial compute credit allocation', 9000, (extract(epoch from now()) * 1000)::bigint - 1728000000),
('token-init-d', 'org-d', 'credit', 8500, 'Initial compute credit allocation', 8500, (extract(epoch from now()) * 1000)::bigint - 1296000000),
('token-init-e', 'org-e', 'credit', 8000, 'Initial compute credit allocation', 8000, (extract(epoch from now()) * 1000)::bigint - 864000000)
ON CONFLICT (id) DO NOTHING;

-- Audit Events
INSERT INTO audit_events (id, timestamp, actor, action, resource, resource_id, details, severity, org_id) VALUES
('audit-1', (extract(epoch from now()) * 1000)::bigint - 2419200000, 'system', 'ORG_JOINED', 'organization', 'org-a', 'Mercy Hospital Network joined the federation', 'info', 'org-a'),
('audit-2', (extract(epoch from now()) * 1000)::bigint - 2160000000, 'system', 'ORG_JOINED', 'organization', 'org-b', 'Reserve Bank of India joined the federation', 'info', 'org-b'),
('audit-3', (extract(epoch from now()) * 1000)::bigint - 1728000000, 'governance-council', 'MODEL_SIGNED', 'model', 'model-v0.2.0', 'Model v0.2.0 signed and deployed', 'info', null),
('audit-4', (extract(epoch from now()) * 1000)::bigint - 864000000, 'system', 'CONTRACT_APPROVED', 'data_contract', 'contract-c', 'HIPAA compliance contract approved for MedTech Solutions', 'info', 'org-c'),
('audit-5', (extract(epoch from now()) * 1000)::bigint - 432000000, 'governance-council', 'MODEL_DEPLOYED', 'model', 'model-v0.3.0', 'Model v0.3.0 deployed to edge endpoints', 'info', null),
('audit-6', (extract(epoch from now()) * 1000)::bigint - 10800000, 'system', 'CROSS_BORDER_BLOCKED', 'transfer', 'xfer-seed-1', 'Cross-border gradient transfer blocked: GDPR data_sovereignty violation', 'warning', 'org-a')
ON CONFLICT (id) DO NOTHING;

-- Approvals
INSERT INTO approvals (id, type, description, requested_by, requested_at, status, decided_by, decided_at, resource_id, org_id) VALUES
('approval-1', 'policy_change', 'Propose reducing gradient retention from 72h to 48h', 'org-a', (extract(epoch from now()) * 1000)::bigint - 43200000, 'pending', null, null, 'policy-1', 'org-a'),
('approval-2', 'cross_border_transfer', 'Request to share anonymized model metrics with org-d (UK)', 'org-c', (extract(epoch from now()) * 1000)::bigint - 21600000, 'pending', null, null, 'xfer-seed-2', 'org-c')
ON CONFLICT (id) DO NOTHING;

-- Regulation Rules
INSERT INTO regulation_rules (id, regulation, region, rule, description, requirement, automated_check) VALUES
('reg-1', 'GDPR', 'EU', 'Article 44', 'Cross-border data transfer requires adequacy decision', 'Verify recipient country has adequate data protection laws', true),
('reg-2', 'GDPR', 'EU', 'Article 22', 'Automated decision-making safeguards', 'Human review capability for model decisions affecting individuals', true),
('reg-3', 'DPDP', 'India', 'Section 16', 'Data localization for sensitive personal data', 'Sensitive data must be stored and processed only in India', true),
('reg-4', 'HIPAA', 'US', '164.312(a)(1)', 'Access control for ePHI', 'Technical safeguards for electronic protected health information', true),
('reg-5', 'HIPAA', 'US', '164.308(b)', 'Audit controls', 'Hardware, software, and procedural mechanisms to record and examine access', true),
('reg-6', 'UK-GDPR', 'UK', 'Schedule 21', 'International transfers post-Brexit', 'Transfer impact assessment required for non-UK recipients', true),
('reg-7', 'PDPA', 'Singapore', 'Part 5', 'Transfer of personal data outside Singapore', 'Comparable protection standard in receiving country', true)
ON CONFLICT (id) DO NOTHING;
