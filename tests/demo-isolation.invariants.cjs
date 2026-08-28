const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const api = read('server/api.ts');
const db = read('server/db.ts');
const app = read('src/App.tsx');
const auth = read('src/context/AuthContext.tsx');
const guest = read('src/components/common/GuestInstitutionalPage.tsx');
const navbar = read('src/components/layout/Navbar.tsx');
const companyDashboard = read('src/components/company/CompanyDashboard.tsx');
const userManager = read('src/components/users/UserManager.tsx');
const freightShowcase = read('src/components/common/FreightShowcasePage.tsx');
const demoSeed = db.slice(db.indexOf('const demoUsers'), db.indexOf('const demoDriver'));

function assert(condition, message) {
  if (!condition) throw new Error(`DEMO_ISOLATION_INVARIANT_FAILED: ${message}`);
}

assert(db.includes("PUBLIC_DEMO_TENANT_ID = 'tenant-demo-public'"), 'tenant demo fixo deve ser declarado');
assert(db.includes("accountType: 'TEST'") && db.includes('readOnly: true'), 'dados demo devem ser TEST e somente leitura');
assert(demoSeed.includes("role: 'EMPRESA_SUPER_ADMIN'") && !demoSeed.includes("role: 'SUPER_ADMIN'"), 'seed público não pode criar Super Admin');
assert(api.includes("apiRouter.post('/auth/demo-session'") && api.includes('PUBLIC_DEMO_PRIMARY_USER_ID') && api.includes('requestedUserId'), 'rota pública deve emitir sessão apenas para perfis fictícios permitidos');
assert(api.includes("action: requestedUserId === PUBLIC_DEMO_PRIMARY_USER_ID ? 'DEMO_SESSION_STARTED' : 'DEMO_PROFILE_SELECTED'"), 'seleção de perfil demo deve ser auditada');
assert(api.includes('user.tenantId === PUBLIC_DEMO_TENANT_ID') && api.includes("user.role !== 'SUPER_ADMIN'"), 'predicado de demo deve limitar tenant e excluir Super Admin');
assert(api.includes('READ_ONLY_TEST_ACCOUNT'), 'mutação de conta TEST deve ser bloqueada no backend');
assert(api.includes('DEMO_FEATURE_RESTRICTED'), 'funções sensíveis devem retornar bloqueio específico de demo');
assert(api.includes("'/billing/asaas'") && api.includes("'/integrations/whatsapp'") && api.includes("'/saas/config'"), 'billing, integração e config SaaS devem ser protegidos');
assert(api.includes("'/tenant/notification-templates'"), 'modelos de comunicação não podem ser acessados pela demo');
assert(app.includes('startDemoSession') && app.includes('onDemoStart={startDemoSession}'), 'Home deve iniciar sessão demo pelo AuthContext');
assert(app.includes("const isDemo = user?.accountType === 'TEST'") && app.includes('onOpenCreateFreight={!isDemo'), 'App deve reconhecer demo e ocultar a criação rápida do Navbar');
assert(guest.includes('onDemoStart') && guest.includes('Acessar demonstração') && guest.includes('DEMO_PROFILES') && guest.includes('Escolha uma função para experimentar') && guest.includes('user-demo-driver'), 'Home deve permitir escolher um perfil fictício antes da sessão');
assert(navbar.includes('const isDemo') && navbar.includes('Ambiente de demonstração'), 'Navbar deve sinalizar a demo');
assert(navbar.includes(') : isDemo ? ('), 'Navbar deve ter ramo dedicado para o menu demo');
assert(companyDashboard.includes('const isDemo') && companyDashboard.includes('isOpen={!isDemo && isWhatsAppModalOpen}') && companyDashboard.includes('simulateOnly={isDemo}') && companyDashboard.includes("isDemo ? 'Simular cadastro'"), 'painel de fretes deve simular cadastro e ocultar config WhatsApp na demo');
assert(userManager.includes('Simular usuário') && userManager.includes('Nada foi salvo no sistema') && userManager.includes("accountType: 'TEST'"), 'gestão de usuários deve permitir apenas simulações locais na demo');
assert(freightShowcase.includes('A aprovação é feita pela empresa responsável pelo frete.'), 'vitrine deve explicar a aprovação pela empresa responsável pelo frete');
const templates = read('src/components/superadmin/NotificationTemplatesPanel.tsx');
assert(templates.includes('fixed bottom-5 right-5') && templates.includes('setTimeout(() => setNotice(null), 4200)'), 'confirmação de mensagens deve aparecer como toast flutuante temporário');
assert(!templates.includes("notice.error ? 'bg-rose-50 text-rose-800'"), 'editor não deve usar o banner antigo no início da tela');
assert(!auth.includes('setAuthToken(userId)'), 'troca de perfil nunca pode usar ID como token');

console.log('DEMO_ISOLATION_INVARIANTS_OK');
console.log('A sessão demo é pública, tenant-scoped, TEST/read-only, sem Super Admin e sem controles de cobrança/credenciais.');
