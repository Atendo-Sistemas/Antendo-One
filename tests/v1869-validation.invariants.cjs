const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'server/api.ts'), 'utf8');
const users = fs.readFileSync(path.join(root, 'src/components/users/UserManager.tsx'), 'utf8');

function must(text, pattern, message) {
  if (!pattern.test(text)) throw new Error(message);
}

must(api, /validateFormAnswers[\s\S]*field\.type === 'number'/, 'respostas numéricas sem validação');
must(api, /field\.type === 'email'[\s\S]*\^\[\^\\s@\]/, 'e-mail de formulário sem validação');
must(api, /normalizedCpf\.length !== 11/, 'motorista sem validação de CPF');
must(api, /normalizedCnh/, 'motorista sem validação de CNH');
must(api, /Este CPF já está associado/, 'CPF de motorista sem unicidade');
must(api, /Os dados do veículo são inválidos/, 'veículo inválido sem rejeição');
must(api, /let nextTenantId/, 'troca de papel sem tenant efetivo');
must(api, /user\.tenantId = nextTenantId/, 'tenant não persistido com a troca de papel');
must(users, /canAssignCompanyAdmin = user\?\.role === 'SUPER_ADMIN'/, 'UI oferece administrador de empresa sem autorização');
must(users, /canAssignSaasAdmin && <option value="SUPER_ADMIN"/, 'UI oferece Super Admin sem autorização');

console.log('V1869_VALIDATION_INVARIANTS_OK');
