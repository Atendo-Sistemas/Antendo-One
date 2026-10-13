const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const ui = fs.readFileSync('src/components/forms/FormBuilder.tsx', 'utf8');

for (const message of [
  'Somente administradores reais podem criar formulários.',
  'Somente administradores reais podem copiar formulários.',
  'Somente administradores reais podem editar formulários.',
  'Somente administradores reais podem desativar formulários.'
]) {
  if (!api.includes(message)) throw new Error(`FORM_AUTH_GUARD_MISSING:${message}`);
}
if (!api.includes("source.tenantId !== req.user.tenantId")) throw new Error('FORM_COPY_TENANT_ISOLATION_MISSING');
if (!ui.includes('useAuth')) throw new Error('FORM_UI_AUTH_CONTEXT_MISSING');
if (!ui.includes('canManageForms')) throw new Error('FORM_UI_PERMISSION_GUARD_MISSING');
if (!ui.includes("['SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN'].includes(user.role)")) throw new Error('FORM_UI_ADMIN_ROLE_GUARD_MISSING');
console.log('FORMS_AUTHORIZATION_INVARIANTS_OK');
