const fs = require('fs');
const app = fs.readFileSync('src/App.tsx','utf8');
const api = fs.readFileSync('src/services/api.ts','utf8');
const nav = fs.readFileSync('src/components/layout/Navbar.tsx','utf8');
const ops = fs.readFileSync('src/components/operations/OperationsCenter.tsx','utf8');
for (const value of ["activeTab === 'budgets'", "activeTab === 'clients'", 'getOfflineQueue', 'markAllNotificationsRead', 'getAuditLogs', 'isDemo']) if (!app.includes(value) && !api.includes(value)) throw new Error(`FLOW_MISSING:${value}`);
for (const value of ['Central', 'aria-label="Navegação principal"']) if (!nav.includes(value)) throw new Error(`MENU_MISSING:${value}`);
for (const value of ['Exportar clientes', 'Importar clientes CSV', 'getDetailedHealth']) if (!ops.includes(value)) throw new Error(`DATA_FLOW_MISSING:${value}`);
console.log('COMPLETE_FLOWS_INVARIANTS_OK');
