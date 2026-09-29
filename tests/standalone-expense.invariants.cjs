const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const create = api.slice(api.indexOf("apiRouter.post('/expenses'"), api.indexOf("// Update report / change status / approve"));
if (!create.includes('freightId: freight?.id')) throw new Error('EXPENSE_FREIGHT_OPTIONAL_MAPPING_MISSING');
if (!create.includes("const freight = data.freightId ?")) throw new Error('EXPENSE_OPTIONAL_FREIGHT_LOOKUP_MISSING');
if (!create.includes("req.user.role === 'MOTORISTA'\n    ? String(data.tenantId || req.user.tenantId || '')")) throw new Error('DRIVER_STANDALONE_EXPENSE_TENANT_SELECTION_MISSING');
if (!create.includes("req.user.role === 'MOTORISTA' && !db.hasDriverCompanyAccess(driver.id, assignedTenantId, true)")) throw new Error('DRIVER_STANDALONE_EXPENSE_TENANT_GUARD_MISSING');
if (!api.includes("['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'MOTORISTA'].includes(req.user.role)")) throw new Error('EXPENSE_ROLE_POLICY_MISSING');
console.log('STANDALONE_EXPENSE_INVARIANTS_OK');
