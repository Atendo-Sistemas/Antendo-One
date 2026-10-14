const fs = require('fs');
const users = fs.readFileSync('src/components/users/UserManager.tsx', 'utf8');
const api = fs.readFileSync('server/api.ts', 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(users.includes("user?.role === 'SUPER_ADMIN' && <label"), 'Super Admin deve ter seletor de empresa no painel de usuários');
assert(users.includes('api.getTenants()'), 'painel deve carregar empresas para a análise de duplicidades');
assert(users.includes('selectedDuplicateTenantId'), 'empresa da análise deve ser mantida em estado próprio');
assert(users.includes("user?.role === 'SUPER_ADMIN' ? selectedDuplicateTenantId : tenant?.id"), 'a consulta deve usar a empresa escolhida pelo Super Admin');
assert(users.includes('Selecione uma empresa para verificar duplicidades.'), 'a interface deve impedir consulta sem empresa');
assert(api.includes("req.user.role === 'SUPER_ADMIN' ? String(req.query.tenantId || '').trim()"), 'backend deve aceitar empresa explícita para Super Admin');
assert(api.includes("if (!tenantId) return res.status(400).json({ error: 'Empresa não identificada.' })"), 'backend deve rejeitar análise sem empresa');
console.log('V1875_USER_DUPLICATE_SUPERADMIN_INVARIANTS_OK');
