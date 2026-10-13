-- Registro persistente e auditável de aceite de documentos legais.
-- Migração exclusivamente aditiva: não executa DROP nem altera registros existentes.
CREATE TABLE IF NOT EXISTS user_legal_consents (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE SET NULL,
    terms_version VARCHAR(64) NOT NULL,
    privacy_version VARCHAR(64) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_user ON user_legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_accepted_at ON user_legal_consents(accepted_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_version VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
