const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const api = read('src/services/api.ts');
const billing = read('src/components/company/CompanyBillingPanel.tsx');
const consent = read('src/components/common/NotificationConsentPanel.tsx');
const app = read('src/App.tsx');
const help = read('src/components/common/HelpPanel.tsx');
const db = read('server/db.ts');
const templates = read('src/components/superadmin/NotificationTemplatesPanel.tsx');

assert.match(api, /getAsaasFinancialSummary\(tenantId\?: string\)/, 'financeiro deve aceitar tenantId explícito');
assert.match(api, /financial-summary.*tenantId.*encodeURIComponent/, 'financeiro deve enviar tenantId de forma codificada');
assert.match(api, /getNotificationModuleStatus\(tenantId\?: string\)/, 'módulo de notificações deve aceitar tenantId explícito');
assert.match(billing, /onOpenNotificationTemplates && <button/, 'empresa deve sempre ter acesso ao editor de mensagens autorizado');
assert.match(billing, /userFacingError\(error/, 'erros financeiros não devem chegar crus à interface');
assert.match(consent, /mode\?: 'preferences' \| 'freight-alerts'/, 'painel deve possuir modos distintos');
assert.match(consent, /showPreferences && <div/, 'preferências pessoais devem ser condicionais');
assert.match(consent, /showFreightAlerts && canConfigureCompany && geoConfig/, 'alertas geográficos devem exigir modo e administrador real');
assert.match(app, /NotificationConsentPanel mode="preferences"/, 'rota de preferências deve usar o modo pessoal');
assert.match(app, /NotificationConsentPanel mode="freight-alerts"/, 'rota de alertas deve usar o modo geográfico');
assert.match(db, /ensureHelpPages\(\)/, 'conteúdo padrão de ajuda deve ser garantido');
for (const role of ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'USER', 'DRIVER']) {
  assert.match(db, new RegExp(`${role}:`), `ajuda deve possuir conteúdo padrão para ${role}`);
}
assert.match(help, /role === 'SUPER_ADMIN'/, 'Super Admin deve ser normalizado na Ajuda');
assert.match(help, /role === 'MOTORISTA'/, 'Motorista deve ser normalizado para o manual DRIVER');
assert.match(templates, /userFacingError\(error/, 'erros dos modelos não devem expor detalhes técnicos');
assert.doesNotMatch(templates, /isolado neste tenant/, 'interface final não deve expor o termo técnico tenant');
console.log('v1.8.76 settings audit invariants: OK');
