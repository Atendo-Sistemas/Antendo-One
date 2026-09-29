const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const form = fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');
const types = fs.readFileSync('src/types/index.ts', 'utf8');
for (const token of ['targetedDriverId', 'targetedDriverName', 'targetedVehicleId']) {
  if (!api.includes(token) || !types.includes(token)) throw new Error(`PRIVATE_ASSIGNMENT_TOKEN_MISSING:${token}`);
}
if (!form.includes('Direcionar para um motorista específico (opcional)')) throw new Error('PRIVATE_ASSIGNMENT_FORM_MISSING');
if (!form.includes("api.getDrivers('', effectiveTenantId)")) throw new Error('PRIVATE_ASSIGNMENT_FORM_TENANT_QUERY_MISSING');
if (!api.includes("const tenantId = String(req.query.tenantId || '').trim();")) throw new Error('PRIVATE_ASSIGNMENT_TENANT_QUERY_MISSING');
if (!api.includes('db.hasDriverCompanyAccess(driver.id, tenantId, true)')) throw new Error('PRIVATE_ASSIGNMENT_COMPANY_LINK_FILTER_MISSING');
if (!api.includes("f.targetedDriverId === driverId && ['APROVADO', 'DISPONIVEL', 'PUBLICADO'].includes(f.status)")) throw new Error('PRIVATE_ASSIGNMENT_DRIVER_PANEL_FILTER_MISSING');
if (!api.includes('const isPrivateTarget = freight.targetedDriverId === driver.id')) throw new Error('PRIVATE_ASSIGNMENT_ACCEPTANCE_MISSING');
if (!api.includes('Este frete foi direcionado a outro motorista.')) throw new Error('PRIVATE_ASSIGNMENT_TARGET_GUARD_MISSING');
console.log('PRIVATE_FREIGHT_ASSIGNMENT_INVARIANTS_OK');
