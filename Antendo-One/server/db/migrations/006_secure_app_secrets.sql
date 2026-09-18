-- Segredos de integrações ficam criptografados pela aplicação e fora do app_state.
-- Esta migração é aditiva e idempotente: não remove nem altera dados existentes.
CREATE TABLE IF NOT EXISTS app_secrets (
    id TEXT PRIMARY KEY,
    ciphertext TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
