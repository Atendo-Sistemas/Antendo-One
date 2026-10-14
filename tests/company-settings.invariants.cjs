const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = relative => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');
const apiClient = read('src/services/api.ts');
const billing = read('src/components/company/CompanyBillingPanel.tsx');
const help = read('src/components/common/HelpPanel.tsx');
const notifications = read('src/components/common/NotificationConsentPanel.tsx');
const app = read('src/App.tsx');
const navbar = read('src/components/layout/Navbar.tsx');
const driverApprovals = read('src/components/drivers/DriverCompanyLinkPanel.tsx');
const server = read('server/api.ts');

assert.match(apiClient, /getAsaasFinancialSummary\(tenantId\?: string\).*encodeURIComponent\(tenantId\)/);
assert.match(billing, /if \(!tenant\?\.id\)[\s\S]*?setLoading\(false\)/);
assert.match(help, /SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'\]\.includes\(role\).*return 'ADMIN'/);
assert.match(help, /role === 'MOTORISTA'\) return 'DRIVER'/);
assert.match(help, /role === 'USUARIO'\) return 'USER'/);
assert.match(notifications, /mode\?: 'preferences' \| 'freight-alerts'/);
assert.match(notifications, /mode === 'freight-alerts' && canConfigureCompany \? api\.getFreightAlertConfig/);
assert.match(notifications, /showPreferences && isDriver/);
assert.match(navbar, /canManageBilling \? \[\['driver-approvals', 'Aprovação de motoristas'\]/);
assert.match(app, /DriverCompanyLinkPanel/);
assert.match(app, /isCompanyAdmin \? <DriverCompanyLinkPanel \/>/);
assert.match(driverApprovals, /flex flex-wrap gap-2/);
assert.match(server, /apiRouter\.get\('\/driver-company-links'[\s\S]*?SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'/);
assert.match(server, /link\.tenantId !== req\.user\?\.tenantId/);

console.log('COMPANY_SETTINGS_INVARIANTS_OK');
