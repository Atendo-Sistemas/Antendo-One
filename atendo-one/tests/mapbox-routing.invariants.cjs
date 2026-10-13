const fs = require('fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const ui = fs.readFileSync('src/components/budgets/BudgetManager.tsx', 'utf8') + fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');
const service = fs.readFileSync('src/services/api.ts', 'utf8');
for (const value of ['/mapbox/geocode', '/mapbox/directions', 'distanceKm', 'estimatedMinutes', 'Selecione um endereço']) if (!api.includes(value) && !ui.includes(value) && !service.includes(value)) throw new Error(`MAPBOX_ROUTE_INVARIANT_MISSING:${value}`);
if (!service.includes('directions:')) throw new Error('MAPBOX_CLIENT_DIRECTIONS_MISSING');
if (!api.includes('mapbox/driving')) throw new Error('MAPBOX_DRIVING_PROFILE_MISSING');
if (!api.includes('Mapbox não configurado.')) throw new Error('MAPBOX_MISSING_CONFIG_GUARD');
console.log('MAPBOX_ROUTING_INVARIANTS_OK');
