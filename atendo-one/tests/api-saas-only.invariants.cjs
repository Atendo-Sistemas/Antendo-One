const fs = require('fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const billing = fs.readFileSync('src/components/company/CompanyBillingPanel.tsx', 'utf8');
const checklist = fs.readFileSync('src/components/forms/EloLogChecklistModal.tsx', 'utf8');
const guard = "req.user?.role !== 'SUPER_ADMIN'";
if ((api.match(new RegExp(guard.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'g')) || []).length < 2) throw new Error('API_SAAS_GUARD_MISSING');
if (billing.includes('WhatsAppConfigModal') || billing.includes('whatsappOpen')) throw new Error('COMPANY_API_CONFIG_UI_EXPOSED');
if (checklist.includes('Configurar API') || checklist.includes('WhatsAppConfigModal')) throw new Error('CHECKLIST_API_CONFIG_UI_EXPOSED');
console.log('API_SAAS_ONLY_INVARIANTS_OK');
