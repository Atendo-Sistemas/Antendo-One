const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const home = fs.readFileSync(path.join(root, 'src/components/common/GuestInstitutionalPage.tsx'), 'utf8');
const saas = fs.readFileSync(path.join(root, 'src/components/superadmin/SuperAdminDashboard.tsx'), 'utf8');
const client = fs.readFileSync(path.join(root, 'src/services/api.ts'), 'utf8');
const types = fs.readFileSync(path.join(root, 'src/types/index.ts'), 'utf8');

for (const field of ['responsibleName', 'password', 'termsAccepted', 'privacyAccepted']) {
  assert.match(home, new RegExp(field), `campo ${field} ausente na home`);
  assert.match(saas, new RegExp(field), `campo ${field} ausente no SaaS`);
  assert.match(api, new RegExp(field), `campo ${field} ausente no backend`);
}
assert.match(saas, /formatCnpj/, 'SaaS não aplica máscara de CNPJ');
assert.match(saas, /formatPhone/, 'SaaS não aplica máscara de telefone');
assert.match(api, /normalizedCnpj\.length !== 14/, 'backend não valida CNPJ completo');
assert.match(api, /apiRouter\.post\('\/tenants\'/, 'rota de criação SaaS ausente');
assert.match(api, /apiRouter\.post\('\/auth\/verify-registration'/, 'fluxo de verificação pública ausente');
assert.match(api, /await provisionAtendoCrmTenant\(newTenant\)/, 'cadastro público não provisiona Atendo CRM');
assert.match(api, /const provisioning = await provisionAtendoCrmTenant\(newTenant\)/, 'cadastro SaaS não provisiona Atendo CRM');
assert.match(api, /apiRouter\.post\('\/tenants\/:id\/provision-atendo'/, 'retry administrativo ausente');
assert.match(api, /randomBytes\(24\)/, 'senha técnica externa não é gerada de forma aleatória');
assert.ok(!api.includes('tenant.atendoCrmProvisioningError = String(responseData'), 'resposta bruta do provedor não pode ser persistida');
assert.match(types, /atendoCrmProvisioningStatus/, 'metadados externos não estão tipados no Tenant');
assert.match(client, /provisionTenantAtendo/, 'cliente não expõe retry administrativo');
console.log('COMPANY_REGISTRATION_INVARIANTS_OK');
