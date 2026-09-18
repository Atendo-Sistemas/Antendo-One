const fs = require('fs');
const ui = fs.readFileSync('src/components/operations/OperationsCenter.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
for (const value of ['Central de preparação', 'Importar clientes CSV', 'Exportar clientes', 'getDetailedHealth', 'Primeiros passos']) if (!ui.includes(value)) throw new Error(`OPERATIONS_CENTER_MISSING:${value}`);
if (!app.includes("activeTab === 'operations'")) throw new Error('OPERATIONS_ROUTE_MISSING');
console.log('OPERATIONS_CENTER_INVARIANTS_OK');
