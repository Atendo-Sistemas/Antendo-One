const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const api = read('server/api.ts');
const defaults = read('server/notificationDefaults.ts');
const panel = read('src/components/superadmin/NotificationTemplatesPanel.tsx');

assert.match(defaults, /id:\s*'login-otp'/, 'modelo de login OTP ausente');
assert.match(defaults, /eventKey:\s*'LOGIN_OTP'/, 'evento LOGIN_OTP ausente');
assert.match(defaults, /whatsappBody:\s*'\{nomePlataforma\}:[^\n]*\{codigo\}[^\n]*\{validadeMinutos\}/, 'modelo OTP não possui as variáveis esperadas');
assert.match(defaults, /channels:\s*\{ email:\s*false, whatsapp:\s*true, inApp:\s*false \}/, 'canais essenciais do OTP estão incorretos');

assert.match(api, /const LOGIN_OTP_EVENT_KEY = 'LOGIN_OTP'/, 'chave do evento OTP ausente no backend');
assert.match(api, /const LOGIN_OTP_DEFAULT_BODY = '[^\n]*\{nomePlataforma\}[^\n]*\{codigo\}[^\n]*\{validadeMinutos\}/, 'fallback seguro do OTP ausente');
assert.match(api, /db\.saasGlobalConfig\.systemName/, 'nome oficial do SaaS não é usado pelo OTP');
assert.match(api, /const renderLoginOtpMessage = \(code: string, validityMinutes: number(?:, tenantId\?: string \| null)?\)/, 'renderização do OTP configurável ausente');
assert.match(api, /const messageBody = renderLoginOtpMessage\(code, 5, targetUser\.tenantId\)/, 'rota de OTP não usa o modelo configurável');
assert.doesNotMatch(api, /const messageBody = `ELO LOG: seu código de acesso/, 'mensagem OTP voltou a ficar fixa em ELO LOG');
assert.match(api, /LOGIN_OTP_REQUIRED_VARIABLES\.every/, 'backend não valida variáveis obrigatórias do OTP');
assert.match(api, /LOGIN_OTP_ALLOWED_VARIABLES/, 'backend não restringe variáveis do OTP');
assert.match(api, /template\.channels = \{ email: false, whatsapp: true, inApp: false \}/, 'backend não protege o canal essencial do OTP');

assert.match(panel, /isOtpTemplate = selected\?\.eventKey === 'LOGIN_OTP'/, 'painel não identifica o modelo OTP');
assert.match(panel, /Prévia segura da mensagem/, 'painel não exibe prévia segura do OTP');
assert.match(panel, /\{codigo\}/, 'painel não informa a variável de código');
assert.match(panel, /\{validadeMinutos\}/, 'painel não informa a variável de validade');
assert.match(panel, /channelsReadOnly = isTenantScope \|\| isOtpTemplate/, 'painel não protege os canais essenciais do OTP e do tenant');
assert.match(panel, /disabled=\{selected\.systemLocked \|\| channelsReadOnly\}/, 'painel permite desativar o canal essencial do OTP');

console.log('NOTIFICATION_OTP_INVARIANTS_OK');
