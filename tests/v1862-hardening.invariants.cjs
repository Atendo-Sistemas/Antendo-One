const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const fill = fs.readFileSync(path.join(root, 'src/components/forms/FormFillModal.tsx'), 'utf8');
const version = fs.readFileSync(path.join(root, 'src/version.ts'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(version.includes("APP_VERSION = 'v1.8.62'"), 'version must be v1.8.62');
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
console.log('V1862_HARDENING_INVARIANTS_OK');
