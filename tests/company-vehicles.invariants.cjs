const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const service = fs.readFileSync(path.join(root, 'src/services/api.ts'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/components/company/CompanyVehicleManager.tsx'), 'utf8');
const version = fs.readFileSync(path.join(root, 'src/version.ts'), 'utf8');

for (const route of ["apiRouter.get('/company-vehicles'", "apiRouter.post('/company-vehicles'", "apiRouter.put('/company-vehicles/:id'", "apiRouter.delete('/company-vehicles/:id'"]) {
  assert.ok(api.includes(route), `Rota ausente: ${route}`);
}
for (const method of ['getCompanyVehicles', 'createCompanyVehicle', 'updateCompanyVehicle', 'deleteCompanyVehicle']) {
  assert.match(service, new RegExp(`async ${method}\\b`), `Método de API ausente: ${method}`);
}
assert.match(api, /vehicle\.tenantId === tenantId && \(normalizePublicPlate\(vehicle\.plate\) === plate/);
assert.match(api, /String\(body\.chassis \|\| ''\)/);
assert.match(api, /item\.tenantId === vehicle\.tenantId && \(normalizePublicPlate\(item\.plate\) === nextPlate/);
assert.match(api, /await db\.persistNow\(\)/);
assert.match(ui, /Cadastrar veículo próprio/);
assert.match(ui, /RENAVAM/);
assert.match(ui, /Chassi/);
assert.match(ui, /Combustível/);
assert.match(ui, /Número do CRLV/);
assert.match(ui, /Proprietário\/razão social/);
assert.match(version, /APP_VERSION = 'v1\.8\.24'/);
console.log('COMPANY_VEHICLES_INVARIANTS_OK');
