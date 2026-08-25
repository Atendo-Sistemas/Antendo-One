const fs = require('fs');

let content = fs.readFileSync('server/api.ts', 'utf-8');

const search = `
  user.updatedAt = new Date().toISOString();

  // If driver, sync driver info`;

const replace = `
  user.updatedAt = new Date().toISOString();
  
  db.addAuditLog({
    tenantId: user.tenantId || undefined,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'UPDATE_PROFILE',
    entity: 'User',
    entityId: user.id,
    details: \`Usuário atualizou o próprio perfil \${password && password.trim() ? '(incluindo alteração de senha)' : ''}\`
  });

  // If driver, sync driver info`;

content = content.replace(search, replace);
fs.writeFileSync('server/api.ts', content);
console.log('patched profile');
