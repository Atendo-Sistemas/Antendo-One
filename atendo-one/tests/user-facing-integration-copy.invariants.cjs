const fs = require('node:fs');
const files = [
  'src/components/budgets/BudgetManager.tsx',
  'src/components/freight/FreightFormModal.tsx',
  'src/components/tracking/InteractiveMapboxView.tsx'
];
const source = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
for (const text of ['Calcular rota no Mapbox', 'sugestão do Mapbox', 'Mapbox API & Rastreio', 'Aviso do Mapa Mapbox', 'CNPJ.ws']) {
  if (source.includes(text)) throw new Error(`USER_FACING_TECHNICAL_COPY_PRESENT:${text}`);
}
if (!source.includes('Calcular rota') || !source.includes('sugestões de endereço')) throw new Error('USER_FACING_NEUTRAL_COPY_MISSING');
console.log('USER_FACING_INTEGRATION_COPY_INVARIANTS_OK');
