const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const trackingModal = fs.readFileSync(path.resolve(__dirname, '../src/components/tracking/LiveRouteTrackingModal.tsx'), 'utf8');
const freightForm = fs.readFileSync(path.resolve(__dirname, '../src/components/freight/FreightFormModal.tsx'), 'utf8');
const budgetManager = fs.readFileSync(path.resolve(__dirname, '../src/components/budgets/BudgetManager.tsx'), 'utf8');
const serverApi = fs.readFileSync(path.resolve(__dirname, '../server/api.ts'), 'utf8');
const clientApi = fs.readFileSync(path.resolve(__dirname, '../src/services/api.ts'), 'utf8');

assert.doesNotMatch(trackingModal, /https:\/\/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places/);
assert.match(trackingModal, /canRenderTrackingMap/);
assert.doesNotMatch(trackingModal, /-23\.5505|-46\.6333|-22\.9068|-43\.1729/);

assert.match(freightForm, /addressCache\.current\.clear\(\)/);
assert.match(freightForm, /convertedFreightId/);
assert.match(freightForm, /vinculado ao frete/);
assert.match(budgetManager, /addressCache\.current\.clear\(\)/);
assert.match(budgetManager, /Converter o orçamento/);

assert.match(serverApi, /budgetFreightRequiredFields/);
assert.match(serverApi, /Preencha os campos obrigatórios antes da conversão/);
assert.match(serverApi, /getTenantReportOwner\(req, req\.query\.tenantId\)/);
assert.match(serverApi, /getEditableTenantReportOwner\(req, req\.body\?\.tenantId\)/);
assert.match(clientApi, /getTenantReportTemplates\(tenantId\?: string\)/);

console.log('BUDGET_FREIGHT_GUARDRAILS_INVARIANTS_OK');
