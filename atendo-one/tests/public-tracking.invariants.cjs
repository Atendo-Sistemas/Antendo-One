const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../server/api.ts'), 'utf8');
const routeStart = source.indexOf("apiRouter.get('/public/tracking/:token'");
assert.ok(routeStart >= 0, 'A rota de rastreio público deve existir.');
const routeEnd = source.indexOf("apiRouter.post('/public/freights/:id/interest'", routeStart);
const routeBlock = source.slice(Math.max(0, source.lastIndexOf('const publicTrackingPayload', routeStart)), routeEnd > routeStart ? routeEnd : routeStart + 1800);
assert.match(routeBlock, /isPublicFreight\(freight\)\s*\|\|\s*isPublicTrackingFreight\(freight\)|isPublicFreight\(item\)/, 'O rastreio deve exigir frete válido.');
assert.match(routeBlock, /publicTrackingToken\s*===\s*token/, 'O rastreio deve exigir o token aleatório do frete.');
assert.match(source, /publicTrackingToken\s*[:=][^\n]*randomBytes\(16\)/, 'O token público deve ser aleatório.');
assert.doesNotMatch(routeBlock, /item\.code|item\.id|freight\.code\.toLowerCase|freight\.id\s*===\s*token/, 'O rastreio não pode aceitar código sequencial ou ID interno.');
assert.match(routeBlock, /publicTrackingPayload\(freight\)/, 'A rota deve usar o DTO minimizado.');
assert.doesNotMatch(routeBlock, /payment|assignedDriverPhone|tenantId|statusHistory|customData|formResponses|cpf|cnh|bank/i, 'O DTO público não pode incluir dados financeiros, pessoais ou internos.');
console.log('PUBLIC_TRACKING_INVARIANTS_OK');
