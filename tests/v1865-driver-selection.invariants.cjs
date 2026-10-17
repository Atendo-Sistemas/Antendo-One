const fs = require('fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const form = fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(api.includes("driver.tenantId === tenantId || db.hasDriverCompanyAccess(driver.id, tenantId, true)"), 'Super Admin driver list must include direct tenant registrations');
assert(api.includes("d.tenantId === req.user.tenantId || db.hasDriverCompanyAccess(d.id, req.user.tenantId, true)"), 'Company driver list must include direct tenant registrations');
assert(api.includes("driver.tenantId === tenantId || db.hasDriverCompanyAccess(driver.id, tenantId!, true)"), 'Freight targeting must accept a direct tenant driver');
assert(api.includes("driver.tenantId !== freight.tenantId && !db.hasDriverCompanyAccess(driver.id, freight.tenantId, true)"), 'Manual driver assignment must accept a direct tenant driver');
assert(form.includes("api.getDrivers('', effectiveTenantId)"), 'Freight form must request drivers for the effective tenant');
assert(form.includes('companyDrivers.filter(driver => driver.status !== \'INATIVO\')'), 'Freight form must hide inactive drivers only');
console.log('V1865_DRIVER_SELECTION_INVARIANTS_OK');
