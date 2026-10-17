const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const acceptBlock = api.slice(api.indexOf("apiRouter.post('/freights/:id/accept'"), api.indexOf("apiRouter.post('/freights/:id/locations'"));
const tracking = fs.readFileSync('src/components/tracking/LiveRouteTrackingModal.tsx', 'utf8');
const map = fs.readFileSync('src/components/tracking/InteractiveMapboxView.tsx', 'utf8');

if (!acceptBlock.includes("freight.status = 'RESERVADO'")) throw new Error('ACCEPTANCE_STATUS_UPDATE_MISSING');
if (acceptBlock.includes('freight.origin =') || acceptBlock.includes('freight.destination =') || acceptBlock.includes('freight.routeGeometry =')) throw new Error('ACCEPTANCE_OVERWRITES_ROUTE_GEOLOCATION');
for (const token of ['freight.origin.lat', 'freight.origin.lng', 'freight.destination.lat', 'freight.destination.lng', 'freight.routeGeometry']) {
  if (!tracking.includes(token)) throw new Error(`TRACKING_GEOLOCATION_FIELD_MISSING:${token}`);
}
if (!map.includes('routeGeometry ||')) throw new Error('MAP_ROUTE_GEOMETRY_FALLBACK_MISSING');
console.log('FREIGHT_ACCEPTANCE_GEOLOCATION_INVARIANTS_OK');
