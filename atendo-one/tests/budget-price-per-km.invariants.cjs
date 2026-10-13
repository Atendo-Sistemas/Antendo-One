const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../server/budgetService.ts'), 'utf8');
assert.match(source, /pricePerKm/, 'O calculador deve aceitar o valor por km.');
assert.match(source, /distanceKm.*pricePerKm|pricePerKm.*distanceKm/, 'O custo da rota deve combinar distância e valor por km.');
assert.match(source, /routeCost/, 'O custo da rota deve estar no resultado financeiro.');
console.log('BUDGET_PRICE_PER_KM_INVARIANTS_OK');
