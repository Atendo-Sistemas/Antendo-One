const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const expensePdf = read('src/utils/expensePdfGenerator.ts');
const checklistPdf = read('src/utils/checklistPdfGenerator.ts');
const branding = read('src/utils/reportBranding.ts');
const db = read('server/db.ts');
const api = read('server/api.ts');
const clientApi = read('src/services/api.ts');
const panel = read('src/components/company/ReportTemplatesPanel.tsx');
const app = read('src/App.tsx');
const navbar = read('src/components/layout/Navbar.tsx');

for (const [name, source] of [['expense PDF', expensePdf], ['checklist PDF', checklistPdf]]) {
  assert.match(source, /resolveReportBranding\(options\.company, options\.system\)/, `${name} não resolve a identidade da empresa e do SaaS`);
  assert.match(source, /addReportFooters\(doc, branding\)/, `${name} não aplica rodapé a todas as páginas`);
  assert.match(source, /template\?: TenantReportTemplate/, `${name} não aceita a cópia do modelo do tenant`);
  assert.doesNotMatch(source, /ELO LOG|Elo Log|ELOLOG|ELO LOG PG/, `${name} ainda contém marca fixa legada`);
}

assert.match(branding, /companyName/);
assert.match(branding, /companyMeta/);
assert.match(branding, /signatureName/);
assert.match(branding, /footerText/);
assert.match(branding, /slugForFilename/);
assert.match(db, /tenantReportTemplates: Map<string, TenantReportTemplate\[\]>/);
assert.match(db, /tenantReportTemplates: safeTenantReportTemplates/);
assert.match(db, /state\.tenantReportTemplates/);
assert.match(db, /getTenantReportTemplates\(tenantId: string\)/);
assert.match(db, /saveTenantReportTemplate\(tenantId: string/);
const reportPersistenceBlock = db.slice(db.indexOf('const safeTenantReportTemplates'), db.indexOf('const safeDatabaseConfig'));
assert.doesNotMatch(reportPersistenceBlock, /token|password|apiKey|webhook/i, 'modelos de relatório não devem carregar segredos');

assert.match(api, /apiRouter\.get\('\/tenant\/report-templates'/);
assert.match(api, /apiRouter\.put\('\/tenant\/report-templates\/:type'/);
assert.match(api, /\['EMPRESA_SUPER_ADMIN', 'ADMIN'\]/);
assert.match(api, /isTestOrDemoUser\(req\.user\)/);
assert.match(api, /db\.getTenantReportTemplates\(tenant\.id\)/);
assert.match(api, /db\.saveTenantReportTemplate\(tenant\.id/);
assert.match(api, /TENANT_REPORT_TEMPLATE_UPDATED/);
assert.match(api, /'\/tenant\/report-templates'/, 'demo não possui bloqueio server-side da edição');

assert.match(clientApi, /getTenantReportTemplates/);
assert.match(clientApi, /updateTenantReportTemplate/);
assert.match(panel, /Salvar cópia da empresa/);
assert.match(panel, /Identidade legal e rodapé do sistema são obrigatórios/);
assert.match(panel, /fixed bottom-5 right-5/);
assert.match(app, /company-report-templates/);
assert.match(app, /ReportTemplatesPanel/);
assert.match(navbar, /canManageReportTemplates/);
assert.match(navbar, /Modelos de relatórios|Relatórios/);

console.log('report-branding invariants: ok');
