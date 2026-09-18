const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const moduleSource = fs.readFileSync(path.join(root, 'server/atendoCrmProvisioning.ts'), 'utf8');
const db = fs.readFileSync(path.join(root, 'server/db.ts'), 'utf8');

assert.match(moduleSource, /buildAtendoCrmCreateTenantRequest/);
assert.match(moduleSource, /createtenant/);
assert.match(moduleSource, /encodeURIComponent\(config\.apiId\)/);
assert.match(moduleSource, /Authorization: `Bearer \$\{config\.bearerToken\}`/);
assert.match(moduleSource, /externalTenantIdFromResponse/);
assert.match(moduleSource, /ATENDO_CRM_DEFAULT_PLAN_ID = '18'/);
assert.match(moduleSource, /timetest: trialTimeForTenant\(tenant\)/);
assert.match(moduleSource, /return 'MENSAL'/);
assert.ok(!moduleSource.includes('fetch('), 'O módulo de preparação não pode executar chamadas externas.');
assert.match(db, /ATENDO_CRM_ADMIN_SECRET_ID = 'atendo-crm-admin'/);
assert.match(db, /persistAtendoCrmAdminSecret/);
assert.match(db, /getAtendoCrmAdminSecretMetadata/);
assert.ok(!db.includes('atendoCrmAdminConfig.bearerToken) return this.atendoCrmAdminConfig'), 'O token administrativo não deve ser retornado em metadata.');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
assert.match(api, /provisionAtendoCrmTenant/);
assert.match(api, /apiRouter\.post\('\/auth\/register-company'/);
assert.match(api, /apiRouter\.post\('\/auth\/verify-registration'/);
assert.match(api, /apiRouter\.post\('\/tenants'/);
assert.match(api, /provisionamento Atendo CRM iniciado/);
assert.match(api, /provisioningStatus/);
console.log('ATENDO_CRM_PROVISIONING_INVARIANTS_OK');
