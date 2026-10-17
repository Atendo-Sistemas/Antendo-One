const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const types = fs.readFileSync(path.join(root, 'src/types/index.ts'), 'utf8');
const service = fs.readFileSync(path.join(root, 'src/services/api.ts'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/components/common/NotificationConsentPanel.tsx'), 'utf8');
const users = fs.readFileSync(path.join(root, 'src/components/users/UserManager.tsx'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'src/components/driver/DriverDashboard.tsx'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const match = (content, pattern, message) => assert(pattern.test(content), message);

match(types, /interface FreightAlertConfig/, 'FREIGHT_ALERT_CONFIG_TYPE_MISSING');
match(types, /radiusKm: number/, 'FREIGHT_ALERT_RADIUS_MISSING');
match(types, /proximityAlertsEnabled\?: boolean/, 'DRIVER_PROXIMITY_CONSENT_MISSING');
match(types, /currentLocation\?: \{/, 'DRIVER_PRIVATE_LOCATION_MISSING');
match(api, /DEFAULT_FREIGHT_ALERT_CONFIG/, 'FREIGHT_ALERT_DEFAULTS_MISSING');
match(api, /apiRouter\.put\('\/tenant\/freight-alert-config'/, 'FREIGHT_ALERT_CONFIG_ROUTE_MISSING');
match(api, /apiRouter\.post\('\/drivers\/me\/location'/, 'DRIVER_LOCATION_ROUTE_MISSING');
match(api, /driver\.proximityAlertsEnabled !== true/, 'DRIVER_LOCATION_CONSENT_NOT_ENFORCED');
match(api, /haversineKm/, 'HAVERSINE_DISTANCE_MISSING');
match(api, /maxLocationAgeMinutes/, 'LOCATION_FRESHNESS_FILTER_MISSING');
match(api, /maxAccuracyMeters/, 'LOCATION_ACCURACY_FILTER_MISSING');
match(api, /fallbackRegion === 'CITY'/, 'CITY_FALLBACK_MISSING');
match(api, /requireCurrentLocation/, 'REQUIRE_CURRENT_LOCATION_MISSING');
match(api, /eligibleDriverIds/, 'GLOBAL_DRIVER_ELIGIBILITY_DISPATCH_MISSING');
match(api, /notificationTemplateForTenant\(eventKey, user\.tenantId \|\| sourceTenantId\)/, 'TENANT_TEMPLATE_FOR_GLOBAL_DRIVER_MISSING');
match(api, /currentLocation, \.\.\.safeDriver/, 'DRIVER_LOCATION_EXPOSURE_GUARD_MISSING');
match(api, /apiRouter\.get\('\/users\/duplicate-candidates'/, 'DUPLICATE_CANDIDATE_ROUTE_MISSING');
match(api, /apiRouter\.post\('\/users\/merge'/, 'USER_MERGE_ROUTE_MISSING');
match(api, /target\.role !== source\.role/, 'MERGE_ROLE_GUARD_MISSING');
match(api, /target\.tenantId !== source\.tenantId/, 'MERGE_TENANT_GUARD_MISSING');
match(api, /source\.mergedIntoUserId = target\.id/, 'MERGE_AUDIT_LINK_MISSING');
match(api, /notification\.userId === source\.id/, 'MERGE_NOTIFICATION_REASSIGN_MISSING');
match(api, /response\.filledByUserId === source\.id/, 'MERGE_FORM_RESPONSE_REASSIGN_MISSING');
match(service, /getFreightAlertConfig/, 'FREIGHT_ALERT_API_CLIENT_MISSING');
match(service, /updateDriverLocation/, 'DRIVER_LOCATION_API_CLIENT_MISSING');
match(service, /getDuplicateUserCandidates/, 'DUPLICATE_API_CLIENT_MISSING');
match(service, /mergeUsers/, 'MERGE_API_CLIENT_MISSING');
match(panel, /Alertas por proximidade/, 'DRIVER_PROXIMITY_UI_MISSING');
match(panel, /Permitir alertas por proximidade/, 'DRIVER_PROXIMITY_CONSENT_UI_MISSING');
match(panel, /Política de alertas geográficos da empresa/, 'COMPANY_GEO_POLICY_UI_MISSING');
match(users, /Verificar duplicidades/, 'DUPLICATE_SCAN_UI_MISSING');
match(users, /Confirmar unificação/, 'MERGE_CONFIRMATION_UI_MISSING');
match(dashboard, /driver\.proximityAlertsEnabled !== true/, 'PWA_PROXIMITY_CONSENT_GUARD_MISSING');
match(dashboard, /api\.updateDriverLocation/, 'PWA_DRIVER_LOCATION_UPDATE_MISSING');

console.log('V1871_GEOSPATIAL_MERGE_INVARIANTS_OK');
