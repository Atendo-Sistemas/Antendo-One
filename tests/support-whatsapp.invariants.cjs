const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const api = read('server/api.ts');
const modal = read('src/components/common/WhatsAppConfigModal.tsx');
const auth = read('src/context/AuthContext.tsx');
const navbar = read('src/components/layout/Navbar.tsx');
const client = read('src/services/api.ts');
const types = read('src/types/index.ts');

assert.match(api, /apiRouter\.post\('\/support\/sessions'/, 'rota de início de suporte ausente');
assert.match(api, /apiRouter\.post\('\/support\/sessions\/end'/, 'rota de encerramento de suporte ausente');
assert.match(api, /SUPPORT_SESSION_TTL_MS\s*=\s*30\s*\*\s*60\s*\*\s*1000/, 'TTL de suporte não está limitado a 30 minutos');
assert.match(api, /decoded\.support === true/, 'middleware não valida o claim de suporte');
assert.match(api, /activeSupportSessions/, 'sessão de suporte não tem controle server-side');
assert.match(api, /SUPORTE_INICIADO/, 'início de suporte não é auditado');
assert.match(api, /SUPORTE_ENCERRADO/, 'encerramento de suporte não é auditado');
assert.match(api, /pairingCode/, 'pairingCode não é reconhecido no backend');
assert.match(api, /:\s*'PENDING'/, 'resposta pendente de QR não está implementada');
assert.match(api, /JSON\.stringify\(\{ number: requestedNumber \}\)/, 'telefone não é enviado ao endpoint de conexão');
assert.match(api, /\/statuschannel/, 'fallback de status do canal ausente');
assert.match(api, /token:\s*''/, 'resposta segura da configuração não mascara o token');
assert.doesNotMatch(api, /bearertoken\s*=/i, 'token não deve ser enviado em query string');

assert.match(client, /startSupportSession/, 'cliente não inicia sessão de suporte');
assert.match(client, /endSupportSession/, 'cliente não encerra sessão de suporte');
assert.match(client, /pairingCode\?/, 'cliente não aceita pairingCode');
assert.match(client, /requestWhatsAppQr\(tenantId\?\: string, phone\?\: string\)/, 'cliente não aceita telefone de pareamento');
assert.match(modal, /Gerar código de pareamento/, 'modal não oferece código de pareamento');
assert.match(modal, /startStatusPolling/, 'modal não faz polling limitado para QR assíncrono');
assert.match(modal, /stopStatusPolling/, 'modal não cancela polling');
assert.match(modal, /Token salvo no cofre criptografado/, 'modal não informa a persistência segura do token');
assert.match(modal, /canRequestConnectionCode/, 'modal não bloqueia conexão global ambígua no Super Admin');
assert.match(auth, /supportSession/, 'contexto não mantém estado de suporte');
assert.match(navbar, /Acesso de suporte ativo/, 'banner de suporte não está visível');
assert.match(navbar, /Retornar ao Super Admin/, 'retorno ao Super Admin não está disponível');
assert.match(types, /PAIRING_CODE_AVAILABLE/, 'tipo de status de pareamento ausente');

console.log('SUPPORT_WHATSAPP_INVARIANTS_OK');
