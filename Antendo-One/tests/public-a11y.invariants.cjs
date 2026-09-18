const fs = require('fs');
const home = fs.readFileSync('src/components/common/GuestInstitutionalPage.tsx', 'utf8');
const nav = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
if (/Controle de Tenants|Multi-Tenant|Elo Log/.test(home)) throw new Error('PUBLIC_LEGACY_COPY_PRESENT');
if (!home.includes('Atendo One')) throw new Error('PUBLIC_BRAND_MISSING');
if (!nav.includes("['clients', 'Clientes']")) throw new Error('CLIENTS_NAV_MISSING');
if (!nav.includes("setActiveTab('driver-profile')")) throw new Error('DRIVER_PROFILE_NAV_MISSING');
if (!nav.includes('md:hidden')) throw new Error('MOBILE_NAV_GUARD_MISSING');
console.log('PUBLIC_A11Y_COPY_INVARIANTS_OK');
