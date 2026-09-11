import { Budget, BudgetExpense, BudgetTax, BudgetFinancials } from '../src/types';

const money = (value: unknown) => Math.round((Number(value) || 0) * 100) / 100;
export function calculateBudget(input: Pick<Budget, 'expenses'|'taxes'|'profitType'|'profitValue'|'driverPassed'|'driverPaid'> & Partial<Pick<Budget, 'distanceKm'|'pricePerKm'|'tolls'|'insurance'|'dailyRate'|'dailyCount'|'assistantCount'|'assistantDailyRate'>>): BudgetFinancials {
  const expenses = (input.expenses || []).map((item: BudgetExpense) => ({ ...item, quantity: Number(item.quantity) || 0, unitPrice: money(item.unitPrice), total: money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }));
  const totalExpenses = money(expenses.reduce((sum, item) => sum + item.total, 0));
  const routeCost = money((Number(input.distanceKm) || 0) * (Number(input.pricePerKm) || 0));
  const tolls = money(input.tolls); const insurance = money(input.insurance);
  const lodging = money((Number(input.dailyRate) || 0) * (Number(input.dailyCount) || 0));
  const assistants = money((Number(input.assistantCount) || 0) * (Number(input.assistantDailyRate) || 0) * (Number(input.dailyCount) || 1));
  const subtotal = money(totalExpenses + routeCost + tolls + insurance + lodging + assistants);
  const totalTaxes = money((input.taxes || []).reduce((sum, tax: BudgetTax) => {
    const base = tax.base === 'DESPESAS' ? totalExpenses : tax.base === 'SUBTOTAL' ? subtotal : money(Number(input.driverPassed) || 0);
    return sum + (tax.type === 'FIXO' ? money(tax.fixedValue) : money(base * (Number(tax.percentage) || 0) / 100));
  }, 0));
  const totalCost = money(subtotal + totalTaxes);
  const profit = input.profitType === 'FIXO' ? money(input.profitValue) : money(totalCost * (Number(input.profitValue) || 0) / 100);
  const totalFreight = money(totalCost + profit);
  const driverPassed = money(input.driverPassed);
  const driverPaid = money(input.driverPaid);
  return { totalExpenses, routeCost, tolls, insurance, lodging, assistants, subtotal, totalTaxes, totalCost, profit, totalFreight, driverPassed, driverPaid, netResult: money(totalFreight - driverPaid - totalExpenses - routeCost - tolls - insurance - lodging - assistants - totalTaxes) };
}
export function normalizeExpense(input: Partial<BudgetExpense>, index: number): BudgetExpense {
  const quantity = Number(input.quantity ?? 1); const unitPrice = money(input.unitPrice ?? input.total ?? 0);
  return { id: String(input.id || `expense-${index + 1}`), description: String(input.description || '').trim().slice(0, 160), category: String(input.category || 'OUTROS').slice(0, 60), quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : 0, unit: String(input.unit || 'un').slice(0, 30), unitPrice, total: money(quantity * unitPrice), notes: String(input.notes || '').slice(0, 500) };
}
