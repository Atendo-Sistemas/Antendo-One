const fs = require('fs');

function replaceAll(file, search, replace) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.split(search).join(replace);
  fs.writeFileSync(file, content);
}

// 1. Rename in types
replaceAll('src/types/index.ts', 'maxFreightsPerMonth: number;', 'maxFreightsMonthly: number;');

// 2. Rename in SaaSConfigPanel
replaceAll('src/components/superadmin/SaaSConfigPanel.tsx', 'maxFreightsPerMonth', 'maxFreightsMonthly');

// 3. Rename and set defaults in db.ts
let dbContent = fs.readFileSync('server/db.ts', 'utf-8');
dbContent = dbContent.replace(
  "{ id: 'BASICO', name: 'Plano Básico', price: 299, maxFreightsPerMonth: 15, maxUsers: 2, maxDrivers: 5, isActive: true },",
  "{ id: 'BASICO', name: 'Plano Básico', price: 299, maxFreightsMonthly: 50, maxUsers: 3, maxDrivers: 5, isActive: true },"
);
dbContent = dbContent.replace(
  "{ id: 'PROFISSIONAL', name: 'Plano Profissional', price: 599, maxFreightsPerMonth: 150, maxUsers: 10, maxDrivers: 30, isActive: true },",
  "{ id: 'PROFISSIONAL', name: 'Plano Profissional', price: 599, maxFreightsMonthly: 150, maxUsers: 10, maxDrivers: 30, isActive: true },"
);
dbContent = dbContent.replace(
  "{ id: 'EMPRESARIAL', name: 'Plano Empresarial', price: 1499, maxFreightsPerMonth: 9999, maxUsers: 50, maxDrivers: 200, isActive: true }",
  "{ id: 'EMPRESARIAL', name: 'Plano Empresarial', price: 1499, maxFreightsMonthly: 9999, maxUsers: 50, maxDrivers: 200, isActive: true }"
);
fs.writeFileSync('server/db.ts', dbContent);

// 4. Fix schema.sql
let schemaContent = fs.readFileSync('server/db/schema.sql', 'utf-8');
schemaContent = schemaContent.replace(
  "'[{\"id\":\"BASICO\",\"name\":\"Plano Básico\",\"price\":299,\"maxFreightsPerMonth\":15,\"maxUsers\":2,\"maxDrivers\":5,\"isActive\":true},{\"id\":\"PROFISSIONAL\",\"name\":\"Plano Profissional\",\"price\":599,\"maxFreightsPerMonth\":150,\"maxUsers\":10,\"maxDrivers\":30,\"isActive\":true},{\"id\":\"EMPRESARIAL\",\"name\":\"Plano Empresarial\",\"price\":1499,\"maxFreightsPerMonth\":9999,\"maxUsers\":50,\"maxDrivers\":200,\"isActive\":true}]'::jsonb",
  "'[{\"id\":\"BASICO\",\"name\":\"Plano Básico\",\"price\":299,\"maxFreightsMonthly\":50,\"maxUsers\":3,\"maxDrivers\":5,\"isActive\":true},{\"id\":\"PROFISSIONAL\",\"name\":\"Plano Profissional\",\"price\":599,\"maxFreightsMonthly\":150,\"maxUsers\":10,\"maxDrivers\":30,\"isActive\":true},{\"id\":\"EMPRESARIAL\",\"name\":\"Plano Empresarial\",\"price\":1499,\"maxFreightsMonthly\":9999,\"maxUsers\":50,\"maxDrivers\":200,\"isActive\":true}]'::jsonb"
);
fs.writeFileSync('server/db/schema.sql', schemaContent);

console.log('patched limits');
