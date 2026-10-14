const fs = require('fs');
const manager = fs.readFileSync('src/components/drivers/DriverManager.tsx', 'utf8');
const api = fs.readFileSync('server/api.ts', 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(manager.includes("?.status !== 'APROVADO'"), 'o seletor não pode ocultar vínculos pendentes ou bloqueados');
assert(manager.includes('existingLink?.status'), 'o seletor deve informar o status do vínculo existente');
assert(manager.includes('Criar ou reativar vínculo aprovado'), 'a ação deve permitir reativação do vínculo');
assert(api.includes("if (req.user?.role !== 'SUPER_ADMIN' && link.tenantId !== req.user?.tenantId)"), 'a atualização do vínculo deve manter isolamento por empresa');
assert(api.includes("if (!['APROVADO', 'RECUSADO', 'BLOQUEADO'].includes(status))"), 'o backend deve aceitar somente status oficiais');
console.log('V1874_DRIVER_COMPANY_LINK_INVARIANTS_OK');
