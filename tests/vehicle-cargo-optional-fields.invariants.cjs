const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const freight = read('src/components/freight/FreightFormModal.tsx');
const budget = read('src/components/budgets/BudgetManager.tsx');
const api = read('server/api.ts');

assert.match(freight, /!isVehicleCargo && fWeight\.enabled/, 'peso do frete não foi ocultado para carga veículo');
assert.match(freight, /!isVehicleCargo && fVolumes\.enabled/, 'volumes do frete não foram ocultados para carga veículo');
assert.match(freight, /Tipo de veículo \/ caminhão \/ implemento \(opcional\)/, 'tipo manual opcional ausente no frete');
assert.match(freight, /vehicleType: isVehicleCargo \? \(vehicleTypeManual\.trim\(\) \|\| undefined\)/, 'tipo manual não é enviado no frete');
assert.match(budget, /!isVehicleCargo.*draft\.weightKg|!isVehicleCargo &&/, 'orçamento não possui regra condicional para peso e volumes');
assert.match(budget, /draft\.vehicleType \|\| ''/, 'orçamento não possui tipo manual de veículo');
assert.match(api, /'VEICULO', 'GERAL'/, 'conversão de orçamento não preserva carga veículo');
console.log('VEHICLE_CARGO_OPTIONAL_FIELDS_INVARIANTS_OK');
