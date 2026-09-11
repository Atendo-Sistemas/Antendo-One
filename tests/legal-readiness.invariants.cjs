const fs = require('fs');
const db = fs.readFileSync('server/db.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const api = fs.readFileSync('server/api.ts', 'utf8');
for (const value of ['Controlador, operador e encarregado', 'Cookies e tecnologias semelhantes', 'Incidentes e reclamações', 'Crianças e adolescentes']) if (!db.includes(value)) throw new Error(`LEGAL_SECTION_MISSING:${value}`);
for (const value of ['/termos-de-uso', '/politica-de-privacidade', 'TermsOfUse', 'PrivacyPolicy']) if (!app.includes(value)) throw new Error(`LEGAL_ROUTE_MISSING:${value}`);
if (!api.includes('/public/registration-content/:slug') || !api.includes('X-Robots-Tag')) throw new Error('LEGAL_ENDPOINT_MISSING');
console.log('LEGAL_READINESS_INVARIANTS_OK');
