const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const fill = fs.readFileSync(path.join(root, 'src/components/forms/FormFillModal.tsx'), 'utf8');
const drivers = fs.readFileSync(path.join(root, 'src/components/drivers/DriverManager.tsx'), 'utf8');
const clientApi = fs.readFileSync(path.join(root, 'src/services/api.ts'), 'utf8');
const saasConfig = fs.readFileSync(path.join(root, 'src/components/superadmin/SaaSConfigPanel.tsx'), 'utf8');
const expenses = fs.readFileSync(path.join(root, 'src/components/expenses/TripExpenseModal.tsx'), 'utf8');
const publicExpense = fs.readFileSync(path.join(root, 'src/components/common/PublicExpensePage.tsx'), 'utf8');
const version = fs.readFileSync(path.join(root, 'src/version.ts'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(version.includes("APP_VERSION = 'v1.8.75'"), 'version must be v1.8.75');
assert(api.includes('function normalizeFormFields'), 'server form normalization missing');
assert(api.includes('validateFormAnswers'), 'server answer validation missing');
assert(api.includes('await db.persistNow();'), 'persistence calls missing');
assert(api.includes("requestedRole = createAsDriver ? 'MOTORISTA'"), 'driver role normalization missing');
assert(api.includes('Você só pode alterar suas próprias respostas.'), 'driver response ownership guard missing');
assert(api.includes("await db.persistNow();\n    return res.json(existingResponse);"), 'form response update persistence missing');
assert(api.includes("await db.persistNow();\n  res.status(201).json(newResponse);"), 'form response create persistence missing');
assert(api.includes("if (!canSubmitExpense) return res.status(403)"), 'test expense submissions remain blocked');
assert(api.includes("Boolean(e.tenantId) && e.tenantId === req.user?.tenantId"), 'expense tenant isolation missing');
assert(api.includes("POST '/drivers/:id/company-link'") || api.includes("post('/drivers/:id/company-link'"), 'driver company link route missing');
assert(fill.includes('const missing = form.fields.find'), 'client required-field validation missing');
assert(fill.includes("field.type === 'checkbox' && field.options"), 'checkbox field renderer missing');
assert(fill.includes('file.size > 8 * 1024 * 1024'), 'file-size guard missing');
assert(!api.includes('body: `ELO LOG:'), 'legacy visible OTP branding remains');
assert(!api.includes('body: `🚚 [ELO LOG]'), 'legacy visible registration branding remains');
assert(!drivers.includes('window.prompt'), 'driver registration still uses native prompt');
assert(drivers.includes("modal === 'create'") && drivers.includes("modal === 'lookup'"), 'driver registration modals missing');
assert(drivers.includes('Vincular empresa') && drivers.includes('Criar ou reativar vínculo aprovado'), 'super admin manual driver link UI missing');
assert(api.includes('tenantName:'), 'driver company link tenant name missing');
assert(clientApi.includes("/driver-company-links/${encodeURIComponent(id)}/status"), 'driver link status client route missing');
assert(!saasConfig.includes("prompt('Digite o ID interno"), 'SaaS form field still uses native prompt');
assert(saasConfig.includes('newFieldModalOpen'), 'SaaS new-field modal missing');
assert(api.includes("apiRouter.get('/public/expenses/:token'"), 'public expense document route missing');
assert(api.includes('publicToken') && api.includes('publicCode'), 'public expense identifiers missing');
assert(expenses.includes('Documento para consulta') && expenses.includes('/prestacao/${report.publicToken}'), 'WhatsApp public document link missing');
assert(!expenses.includes('📋 *PRESTAÇÃO'), 'legacy emoji-heavy expense message remains');
assert(publicExpense.includes('Código de validação') && publicExpense.includes('Documento validado online'), 'public expense page missing');
console.log('V1870_HARDENING_INVARIANTS_OK');
