const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/components/superadmin/VisitAnalyticsPanel.tsx'), 'utf8');

const middlewareIndex = api.indexOf('apiRouter.use(authMiddleware);');
const analyticsIndex = api.indexOf("apiRouter.get('/analytics/visits'");
assert.ok(middlewareIndex >= 0, 'O middleware de autenticação deve existir.');
assert.ok(analyticsIndex > middlewareIndex, 'A rota de analytics deve ser registrada depois do middleware de autenticação.');
assert.match(api.slice(analyticsIndex, analyticsIndex + 500), /req\.user\?\.role !== 'SUPER_ADMIN'/, 'Analytics deve continuar restrito ao Super Admin.');
assert.match(panel, /api\.getVisitAnalytics\(days\)/, 'O painel deve consultar o endpoint autenticado de analytics.');

console.log('ANALYTICS_AUTH_INVARIANTS_OK');
