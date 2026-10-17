const fs = require('fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const ui = fs.readFileSync('src/components/superadmin/SaaSConfigPanel.tsx', 'utf8');
const client = fs.readFileSync('src/services/api.ts', 'utf8');
for (const value of ["/integrations/email/test", "incomingPassword !== '********'", 'connectionTimeout: 15000', 'requireTLS: port === 587 || port === 2525', 'EAUTH']) if (!api.includes(value)) throw new Error(`EMAIL_TEST_INVARIANT_MISSING:${value}`);
if (!ui.includes('api.testEmailConnection') || !client.includes("'/integrations/email/test'")) throw new Error('EMAIL_TEST_FLOW_MISSING');
console.log('EMAIL_TEST_INVARIANTS_OK');
