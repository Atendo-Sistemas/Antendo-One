const fs = require('fs');
const server = fs.readFileSync('server.ts', 'utf8');
const api = fs.readFileSync('server/api.ts', 'utf8');
for (const value of ["express.json({ limit: '10mb' })", 'X-Content-Type-Options', 'Content-Security-Policy', 'rateLimit', 'Retry-After']) if (!server.includes(value)) throw new Error(`HTTP_SECURITY_MISSING:${value}`);
for (const value of ['CLIENT_LOOKUP_LIMIT', 'AbortSignal.timeout(10000)', 'X-Forwarded-For', 'status(429)']) if (!api.includes(value)) throw new Error(`CNPJ_SECURITY_MISSING:${value}`);
console.log('COMMERCIAL_SECURITY_INVARIANTS_OK');
