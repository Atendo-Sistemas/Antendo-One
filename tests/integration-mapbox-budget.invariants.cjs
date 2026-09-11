const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const freight = fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');
const db = fs.readFileSync('server/db.ts', 'utf8');
const service = fs.readFileSync('src/services/api.ts', 'utf8');

for (const token of ['requestedBudgetId', 'linkedBudget', 'budgetCode', 'mapboxPlaceId']) {
  if (!api.includes(token)) throw new Error(`INTEGRATION_MISSING:${token}`);
}
for (const token of ['budgetApi.list()', 'applyBudget', 'Calcular rota', 'searchAddress', 'chooseAddress', 'routeDistanceKm']) {
  if (!freight.includes(token)) throw new Error(`FREIGHT_MAPBOX_BUDGET_UI_MISSING:${token}`);
}
for (const token of ['MAPBOX_SECRET_ID', 'persistMapboxSecret', 'hydrateSecureMapboxConfig', 'WHATSAPP_SECRET_ID', 'persistWhatsAppSecret']) {
  if (!db.includes(token)) throw new Error(`TOKEN_PERSISTENCE_MISSING:${token}`);
}
if (!service.includes("'/mapbox/client-config'")) throw new Error('MAPBOX_RUNTIME_CONFIG_ENDPOINT_MISSING');
console.log('INTEGRATION_MAPBOX_BUDGET_INVARIANTS_OK');
