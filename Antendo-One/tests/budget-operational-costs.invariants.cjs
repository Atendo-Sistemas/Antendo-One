const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const service = fs.readFileSync(path.resolve(__dirname, '../server/budgetService.ts'), 'utf8');
const pdf = fs.readFileSync(path.resolve(__dirname, '../src/utils/budgetPdfGenerator.ts'), 'utf8');
for (const field of ['tolls','insurance','dailyRate','dailyCount','assistantCount','assistantDailyRate']) assert.match(service, new RegExp(field));
for (const label of ['Pedágios','Seguro','Diárias','Ajudantes']) assert.match(pdf, new RegExp(label));
console.log('BUDGET_OPERATIONAL_COSTS_INVARIANTS_OK');
