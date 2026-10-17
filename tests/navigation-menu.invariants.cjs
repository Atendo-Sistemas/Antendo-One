const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const navbar = fs.readFileSync(path.join(root, 'src/components/layout/Navbar.tsx'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const saasConfig = fs.readFileSync(path.join(root, 'src/components/superadmin/SaaSConfigPanel.tsx'), 'utf8');

assert.match(navbar, /companyNavGroups/);
assert.match(navbar, /\['company-vehicles', 'Veículos próprios'\]/);
assert.match(navbar, /setActiveTab\(tab\)/);
assert.match(app, /activeTab === 'company-vehicles' && <CompanyVehicleManager \/>/);
assert.match(navbar, /const canManageBilling = user\?\.role === 'EMPRESA_SUPER_ADMIN' \|\| user\?\.role === 'ADMIN'/);
assert.match(navbar, /openNavGroup === group\.key/);
assert.match(navbar, /className="flex items-center gap-1\.5 no-scrollbar overflow-visible"/);
assert.doesNotMatch(navbar, /<nav[^>]*overflow-x-auto/);
assert.match(navbar, /isDriver \? \(/);
assert.match(navbar, /setActiveTab\('driver-portal'\)/);
assert.match(navbar, /setActiveTab\('driver-profile'\)/);
assert.match(navbar, /setActiveTab\('notification-preferences'\)/);
assert.match(navbar, /setActiveTab\('help'\)/);
assert.doesNotMatch(navbar, /Mapbox API|Configuração da API Mapbox|Access Token/);
assert.match(saasConfig, /MapboxConfigPanel/);

console.log('NAVIGATION_MENU_INVARIANTS_OK');
