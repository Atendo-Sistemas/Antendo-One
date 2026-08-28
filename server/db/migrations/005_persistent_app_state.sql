-- Persistência compatível com o DatabaseStore atual.
-- O estado é salvo como JSONB para evitar perda durante a transição
-- das rotas em memória para uma camada relacional completa.
CREATE TABLE IF NOT EXISTS app_state (
    id VARCHAR(64) PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_state_updated_at ON app_state(updated_at);
