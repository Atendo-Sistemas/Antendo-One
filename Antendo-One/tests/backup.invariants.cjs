const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const api = read('server/api.ts');
const clientApi = read('src/services/api.ts');
const panel = read('src/components/superadmin/BackupMonitorPanel.tsx');
const saasPanel = read('src/components/superadmin/SaaSConfigPanel.tsx');
const types = read('src/types/index.ts');
const backupScript = read('ops/elolog-local-backup.sh');
const dispatcher = read('ops/elolog-backup-dispatcher.sh');
const cron = read('ops/elolog-local-backup.cron');

for (const route of [
  "'/admin/backups/status'",
  "'/admin/backups/notifications'",
  "'/admin/backups/run'",
  "'/admin/backups/whatsapp-test'"
]) assert.match(api, new RegExp(route.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')), `rota ausente: ${route}`);
assert.match(api, /req\.user\?\.role !== 'SUPER_ADMIN'/, 'rotas de backup não exigem Super Admin');
assert.match(api, /BACKUP_EVENT_SECRET_FILE/, 'segredo HMAC do evento não está isolado por arquivo');
assert.match(api, /timingSafeEqual/, 'evento de backup não usa comparação segura de assinatura');
assert.match(api, /X-Backup-Signature|x-backup-signature/, 'assinatura do evento não é validada');
assert.match(api, /Cache-Control.*no-store/, 'status de backup não desabilita cache');
assert.match(api, /whatsappPhoneMasked/, 'resposta do status não mascara o telefone');
assert.ok(api.includes("whatsappPhone === '********'"), 'máscara enviada pelo frontend não preserva o telefone existente');
assert.match(api, /BACKUP_ALERT_CONFIG_UPDATED|BACKUP_MANUAL_REQUESTED/, 'ações do monitor não geram auditoria');
assert.match(api, /fs\.promises\.rename/, 'gatilho manual não é publicado atomicamente');

for (const method of ['getBackupStatus', 'requestManualBackup', 'updateBackupNotifications', 'testBackupWhatsApp']) {
  assert.match(clientApi, new RegExp(`async ${method}\\b`), `método de API ausente: ${method}`);
}
assert.match(panel, /Três últimos backups/, 'painel não lista três últimos backups');
assert.match(panel, /Fazer backup agora/, 'painel não tem execução manual');
assert.match(panel, /Avisar quando houver falha/, 'painel não tem preferência de falhas');
assert.match(panel, /Avisar quando concluir com sucesso/, 'painel não tem preferência de sucesso');
assert.match(panel, /Enviar teste/, 'painel não tem teste WhatsApp');
assert.match(saasPanel, /Monitor de Backups/, 'monitor não está no menu SaaS');
assert.match(types, /interface BackupNotificationConfig/, 'tipo de configuração de alerta ausente');
assert.match(types, /interface BackupStatusResponse/, 'tipo de status de backup ausente');

assert.match(backupScript, /ELOLOG_BACKUP_STATUS_FILE/, 'script não publica status');
assert.match(backupScript, /write_status 'RUNNING'/, 'script não sinaliza execução');
assert.match(backupScript, /write_status 'SUCCESS'/, 'script não sinaliza sucesso');
assert.match(backupScript, /write_status 'ERROR'/, 'script não sinaliza falha');
assert.match(backupScript, /send_event 'ERROR'/, 'script não envia evento de falha');
assert.match(backupScript, /send_event 'SUCCESS'/, 'script não envia evento de sucesso');
assert.match(backupScript, /sha256sum -c SHA256SUMS/, 'script não verifica hashes');
assert.match(backupScript, /ELOLOG_BACKUP_RETENTION/, 'script não tem retenção configurável');
assert.match(backupScript, /--exclude='\.env\.\*'/, 'script não exclui variantes de .env');
assert.match(dispatcher, /manual-\*\.request/, 'dispatcher não consome gatilho manual');
assert.match(dispatcher, /ELOLOG_BACKUP_COMMAND/, 'dispatcher não permite caminho controlado do comando');
assert.match(cron, /CRON_TZ=America\/Sao_Paulo/, 'cron não declara fuso de Brasília');
assert.match(cron, /0 3 \* \* \* root \/usr\/local\/sbin\/elolog-local-backup/, 'cron diário não está configurado');
assert.match(cron, /\* \* \* \* \* root \/usr\/local\/sbin\/elolog-backup-dispatcher/, 'cron não verifica gatilho manual');

console.log('Backup invariants: PASS');
