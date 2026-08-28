const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const api = read('server/api.ts');
const db = read('server/db.ts');
const client = read('src/services/api.ts');
const panel = read('src/components/superadmin/NotificationTemplatesPanel.tsx');
const app = read('src/App.tsx');
const navbar = read('src/components/layout/Navbar.tsx');

assert.match(db, /tenantNotificationTemplates:\s*Map<string, NotificationTemplate\[\]>/, 'estado de templates por tenant ausente');
assert.match(db, /tenantNotificationTemplates:\s*safeTenantNotificationTemplates/, 'templates por tenant não são persistidos no snapshot');
assert.match(db, /state\.tenantNotificationTemplates/, 'templates por tenant não são hidratados do estado persistido');

assert.match(api, /const tenantOwnNumberActive/, 'regra de número próprio ativo ausente');
assert.match(api, /notificationPlan === 'OWN_NUMBER'/, 'plano de número próprio não é verificado');
assert.match(api, /notificationBillingStatus === 'ACTIVE'/, 'status ativo do módulo não é verificado');
assert.match(api, /const notificationTemplateForTenant/, 'resolução de template por tenant ausente');
assert.match(api, /db\.tenantNotificationTemplates\.get\(String\(tenantId\)\)/, 'resolução não está isolada por tenant');
assert.match(api, /const notificationValuesForTenant/, 'variáveis comerciais da empresa ausentes');
assert.match(api, /cnpjEmpresa|emailEmpresa|telefoneEmpresa/, 'variáveis de identificação da empresa ausentes');
assert.match(api, /const template = notificationTemplateForTenant\(eventKey, user\.tenantId\)/, 'dispatcher não usa template do tenant do destinatário');
assert.match(api, /body: interpolateNotification\(template\.whatsappBody, recipientValues\)/, 'WhatsApp não usa valores interpolados por destinatário');
assert.match(api, /apiRouter\.get\('\/tenant\/notification-templates'/, 'rota de leitura por tenant ausente');
assert.match(api, /apiRouter\.put\('\/tenant\/notification-templates\/:id'/, 'rota de edição por tenant ausente');
assert.match(api, /\['EMPRESA_SUPER_ADMIN', 'ADMIN'\]\.includes\(req\.user\.role\)/, 'permissão de edição por empresa incorreta');
assert.match(api, /getEditableTenantNotificationOwner/, 'gating do editor por empresa ausente');
assert.match(api, /tenantOwnNumberActive\(tenant\.id\)/, 'editor não exige número próprio ativo');
assert.match(api, /TENANT_NOTIFICATION_TEMPLATE_UPDATED/, 'edição por empresa não é auditada');
assert.doesNotMatch(api, /db\.tenantNotificationTemplates\.set\([^,]+,\s*\[[^\]]*token/i, 'templates por tenant não devem conter token');

assert.match(client, /getTenantNotificationTemplates/, 'cliente não consulta templates do tenant');
assert.match(client, /updateTenantNotificationTemplate/, 'cliente não salva templates do tenant');
assert.match(panel, /scope\?: 'global' \| 'tenant'/, 'editor não possui escopo tenant');
assert.match(panel, /api\.getNotificationModuleStatus\(tenant\.id\)/, 'editor não consulta status do módulo');
assert.match(panel, /api\.getTenantNotificationTemplates\(\)/, 'editor não carrega templates do tenant');
assert.match(panel, /moduleStatus\.canUseOwnNumber/, 'editor não bloqueia empresas sem número próprio ativo');
assert.match(panel, /Personalizado pela empresa|Herdado do SaaS/, 'editor não distingue override e herança');
assert.match(panel, /nomeEmpresa|cnpjEmpresa|emailEmpresa|telefoneEmpresa/, 'editor não informa variáveis comerciais');

assert.match(app, /NotificationTemplatesPanel scope="tenant"/, 'rota da tela de mensagens da empresa ausente');
assert.match(app, /company-notification-templates/, 'tab de mensagens da empresa ausente');
assert.match(navbar, /setActiveTab\('company-notification-templates'\)/, 'menu da empresa não aponta para o editor');
assert.match(navbar, /Editar mensagens de e-mail e WhatsApp da empresa/, 'atalho de mensagens da empresa ausente');

console.log('TENANT_NOTIFICATION_INVARIANTS_OK');
