const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const budgetUi = fs.readFileSync('src/components/budgets/BudgetManager.tsx', 'utf8');
const freightUi = fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');
const publicUi = fs.readFileSync('src/components/common/FreightInterestModal.tsx', 'utf8');
const detailUi = fs.readFileSync('src/components/freight/FreightDetailModal.tsx', 'utf8');
const driverUi = fs.readFileSync('src/components/drivers/DriverManager.tsx', 'utf8');

for (const token of ['routeGeometry: null', 'mapboxPlaceId: undefined', 'lat: undefined', 'lng: undefined']) {
  if (!budgetUi.includes(token)) throw new Error(`BUDGET_ADDRESS_INVALIDATION_MISSING:${token}`);
}
for (const token of ['setRouteDistanceKm(null)', 'setRouteGeometry(null)', 'setOriginCoordinates({})', 'setDestinationCoordinates({})']) {
  if (!freightUi.includes(token)) throw new Error(`FREIGHT_ADDRESS_INVALIDATION_MISSING:${token}`);
}
if (!api.includes("apiRouter.post('/freights/:id/assign-driver'")) throw new Error('INTERNAL_ASSIGNMENT_ENDPOINT_MISSING');
if (!api.includes("action: 'VINCULO_MOTORISTA_INTERNO'")) throw new Error('INTERNAL_ASSIGNMENT_AUDIT_MISSING');
if (!detailUi.includes('api.assignFreightDriver') || !detailUi.includes('Aceitar e vincular motorista')) throw new Error('INTERNAL_ASSIGNMENT_UI_MISSING');
if (!api.includes("source: 'FREIGHT_INTEREST'")) throw new Error('PUBLIC_FREIGHT_LINK_MISSING');
if (!api.includes("apiRouter.post('/public/freights/:id/interest/complete'")) throw new Error('PUBLIC_DRIVER_PROFILE_ENDPOINT_MISSING');
if (!publicUi.includes('api.completeQuickDriver')) throw new Error('PUBLIC_DRIVER_PROFILE_UI_MISSING');
if (!api.includes("['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)")) throw new Error('DRIVER_DELETE_ROLE_GUARD_MISSING');
if (!driverUi.includes('api.registerDriver')) throw new Error('DRIVER_CREATE_UI_MISSING');
console.log('ADDRESS_ROUTE_DRIVER_FLOW_INVARIANTS_OK');
