-- Compatibility fix for deployments where users and tenants are persisted in app_state.
-- Consent records keep their textual IDs and indexes; no rows are deleted.
BEGIN;

ALTER TABLE user_legal_consents
  DROP CONSTRAINT IF EXISTS user_legal_consents_user_id_fkey,
  DROP CONSTRAINT IF EXISTS user_legal_consents_tenant_id_fkey;

CREATE INDEX IF NOT EXISTS idx_user_legal_consents_user_id
  ON user_legal_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_legal_consents_tenant_id
  ON user_legal_consents(tenant_id);

COMMIT;
