-- Seed Admin Real (admin@atendo.log.br) sem senha fixa.
-- A senha será definida pelo fluxo de primeiro acesso / reset (OTP).
INSERT INTO users (id, tenant_id, name, email, phone, role, status, password_hash, account_type, read_only)
VALUES ('user-admin-atendo', NULL, 'Administrador Atendo Log', 'admin@atendo.log.br', '5517988395429', 'SUPER_ADMIN', 'ATIVO', NULL, 'REAL', false)
ON CONFLICT (id) DO UPDATE SET 
  role = 'SUPER_ADMIN',
  account_type = 'REAL',
  read_only = false;
