const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const types = fs.readFileSync('src/types/index.ts', 'utf8');
const modal = fs.readFileSync('src/components/common/FreightInterestModal.tsx', 'utf8');
if (!api.includes('normalizePublicUf')) throw new Error('PUBLIC_FREIGHT_UF_NORMALIZER_MISSING');
for (const token of ['routeAvailable', 'distanceKm']) if (!api.includes(token) || !types.includes(token)) throw new Error(`PUBLIC_FREIGHT_ROUTE_TOKEN_MISSING:${token}`);
if (!api.includes("if (/^SÃ/.test(raw)")) throw new Error('PUBLIC_FREIGHT_UF_ENCODING_GUARD_MISSING');
if (!modal.includes('Rota ainda não calculada para este frete')) throw new Error('PUBLIC_FREIGHT_ROUTE_MESSAGE_MISSING');
console.log('PUBLIC_FREIGHT_ROUTE_INVARIANTS_OK');
