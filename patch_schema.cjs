const fs = require('fs');

let content = fs.readFileSync('server/db/schema.sql', 'utf-8');

// Add account_type and read_only to users table creation
if (!content.includes('account_type VARCHAR(16)')) {
  content = content.replace(
    'password_hash VARCHAR(255),',
    "password_hash VARCHAR(255),\n    account_type VARCHAR(16) NOT NULL DEFAULT 'REAL',\n    read_only BOOLEAN NOT NULL DEFAULT false,"
  );
}

// Add the idempotent insert for admin@atendo.log.br
const adminSeed = `
-- Seed Admin Real (admin@atendo.log.br) sem senha fixa. (Senha criada posteriormente via reset/OTP)
INSERT INTO users (id, tenant_id, name, email, phone, role, status, password_hash, account_type, read_only)
VALUES ('user-admin-atendo', NULL, 'Administrador Atendo Log', 'admin@atendo.log.br', '1731981705', 'SUPER_ADMIN', 'ATIVO', NULL, 'REAL', false)
ON CONFLICT (id) DO UPDATE SET 
  role = 'SUPER_ADMIN',
  account_type = 'REAL',
  read_only = false;
`;

if (!content.includes('admin@atendo.log.br')) {
  content = content.replace(
    '-- Senha padrão com hash bcrypt:',
    adminSeed + '\n-- Senha padrão com hash bcrypt:'
  );
}

fs.writeFileSync('server/db/schema.sql', content);
console.log('patched schema');
