ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(16) NOT NULL DEFAULT 'REAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS read_only BOOLEAN NOT NULL DEFAULT false;

-- Marcar user-driver-test-17 como teste retroativamente
UPDATE users SET account_type = 'TEST', read_only = true WHERE id = 'user-driver-test-17';
