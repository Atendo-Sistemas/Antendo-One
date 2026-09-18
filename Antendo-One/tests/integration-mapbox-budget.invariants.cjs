const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const freight = fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');
const liveTracking = fs.readFileSync('src/components/tracking/LiveRouteTrackingModal.tsx', 'utf8');
const interactiveMapbox = fs.readFileSync('src/components/tracking/InteractiveMapboxView.tsx', 'utf8');
const db = fs.readFileSync('server/db.ts', 'utf8');
const service = fs.readFileSync('src/services/api.ts', 'utf8');

for (const token of ['requestedBudgetId', 'linkedBudget', 'budgetCode', 'mapboxPlaceId']) {
  if (!api.includes(token)) throw new Error(`INTEGRATION_MISSING:${token}`);
}
for (const token of ['budgetApi.list()', 'applyBudget', 'Calcular rota', 'searchAddress', 'chooseAddress', 'routeDistanceKm']) {
  if (!freight.includes(token)) throw new Error(`FREIGHT_MAPBOX_BUDGET_UI_MISSING:${token}`);
}
for (const token of ['publicTrackingApi.geocode', 'subscribePublicTracking']) {
  if (!liveTracking.includes(token)) throw new Error(`TRACKING_UI_MISSING:${token}`);
}
if (!freight.includes("item.status === 'APROVADO'")) throw new Error('FREIGHT_BUDGET_SELECTION_MUST_BE_APPROVED');
if (liveTracking.includes('api.mapbox.com/geocoding')) throw new Error('TRACKING_UI_BYPASSES_BACKEND_GEOCODE');
if (interactiveMapbox.includes('api.mapbox.com/directions')) throw new Error('TRACKING_UI_BYPASSES_BACKEND_DIRECTIONS');
for (const token of ['MAPBOX_SECRET_ID', 'persistMapboxSecret', 'hydrateSecureMapboxConfig', 'WHATSAPP_SECRET_ID', 'persistWhatsAppSecret']) {
  if (!db.includes(token)) throw new Error(`TOKEN_PERSISTENCE_MISSING:${token}`);
}
for (const token of ['/mapbox/client-config', '/public/mapbox/client-config', '/public/mapbox/geocode']) {
  if (!service.includes(token)) throw new Error(`MAPBOX_RUNTIME_CONFIG_ENDPOINT_MISSING:${token}`);
}
console.log('INTEGRATION_MAPBOX_BUDGET_INVARIANTS_OK');
