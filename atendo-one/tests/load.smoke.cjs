const fs = require('fs');
const api = fs.readFileSync('server/api.ts','utf8');
const server = fs.readFileSync('server.ts','utf8');
if (!server.includes('rateLimit') || !server.includes("express.json({ limit: '10mb' })")) throw new Error('LOAD_GUARDS_MISSING');
if (!api.includes('CLIENT_LOOKUP_LIMIT') || !api.includes('clientLookupCache')) throw new Error('LOOKUP_LOAD_GUARDS_MISSING');
console.log('LOAD_SMOKE_INVARIANTS_OK');
