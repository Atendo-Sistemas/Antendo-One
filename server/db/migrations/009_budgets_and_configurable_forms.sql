-- Atendo One v1.7.20: additive budget domain. No existing data is dropped.
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'RASCUNHO', version INTEGER NOT NULL DEFAULT 1,
  client_name TEXT NOT NULL DEFAULT '', origin JSONB NOT NULL DEFAULT '{}'::jsonb, destination JSONB NOT NULL DEFAULT '{}'::jsonb,
  financials JSONB NOT NULL DEFAULT '{}'::jsonb, expenses JSONB NOT NULL DEFAULT '[]'::jsonb, taxes JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budgets_status_chk CHECK (status IN ('RASCUNHO','EM_ANALISE','APROVADO','REPROVADO','CANCELADO','CONVERTIDO'))
);
CREATE UNIQUE INDEX IF NOT EXISTS budgets_tenant_code_uq ON budgets(tenant_id, code);
CREATE INDEX IF NOT EXISTS budgets_tenant_status_idx ON budgets(tenant_id, status);
CREATE TABLE IF NOT EXISTS budget_versions (
  id TEXT PRIMARY KEY, budget_id TEXT NOT NULL REFERENCES budgets(id), version INTEGER NOT NULL, snapshot JSONB NOT NULL,
  created_by_user_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approved_at TIMESTAMPTZ NULL,
  UNIQUE(budget_id, version)
);
CREATE TABLE IF NOT EXISTS tenant_budget_forms (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, active BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_budget_forms_kind_chk CHECK (kind IN ('BUDGET','EXPENSE'))
);
CREATE INDEX IF NOT EXISTS tenant_budget_forms_scope_idx ON tenant_budget_forms(tenant_id, kind, active);
CREATE TABLE IF NOT EXISTS freight_locations (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, freight_id TEXT NOT NULL, driver_id TEXT NOT NULL,
  latitude NUMERIC(10,7) NOT NULL, longitude NUMERIC(10,7) NOT NULL, accuracy_meters NUMERIC(10,2), speed_kmh NUMERIC(10,2),
  device_recorded_at TIMESTAMPTZ, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS freight_locations_lookup_idx ON freight_locations(tenant_id, freight_id, received_at DESC);
