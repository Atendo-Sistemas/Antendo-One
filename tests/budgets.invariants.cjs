const fs = require('fs');
const service = fs.readFileSync('server/budgetService.ts', 'utf8');
const api = fs.readFileSync('server/api.ts', 'utf8');
const migration = fs.readFileSync('server/db/migrations/009_budgets_and_configurable_forms.sql', 'utf8');
for (const token of ['calculateBudget', 'normalizeExpense', 'totalExpenses', 'totalTaxes', 'netResult']) if (!service.includes(token)) throw new Error(`Missing calculator invariant: ${token}`);
for (const token of ["/budgets", '/budgets/:id/status', '/budgets/:id/duplicate', '/budgets/:id/convert', 'idempotent', "status === 'APROVADO'"]) if (!api.includes(token)) throw new Error(`Missing API invariant: ${token}`);
for (const token of ['CREATE TABLE IF NOT EXISTS budgets', 'budget_versions', 'tenant_budget_forms', 'freight_locations', 'NUMERIC']) if (!migration.includes(token)) throw new Error(`Missing migration invariant: ${token}`);
console.log('BUDGET_INVARIANTS_OK');
