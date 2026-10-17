const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const form = read('src/components/freight/FreightFormModal.tsx');
const api = read('server/api.ts');

assert.match(form, /tenantApi\.listTenants\(\)/, 'o formulário de frete não carrega empresas para o Super Admin');
assert.match(form, /tenantId: selectedTenantId/, 'o formulário não envia a empresa selecionada');
assert.match(form, /Selecione a empresa responsável pelo frete/, 'o formulário não impede cadastro sem empresa');
assert.match(api, /'\/mapbox\/directions'/, 'directions não está liberado no middleware');
assert.match(api, /apiRouter\.get\('\/mapbox\/directions'/, 'rota de direções ausente');
assert.match(api, /tenantId = req\.user\?\.role === 'SUPER_ADMIN' \? \(req\.body\.tenantId \|\| null\)/, 'backend não usa tenantId enviado pelo Super Admin');

console.log('FREIGHT_CREATE_ROUTE_AUTH_INVARIANTS_OK');
