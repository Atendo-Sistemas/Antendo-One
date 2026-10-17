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
  const taxes = (input.taxes || []).map((tax: BudgetTax) => ({
    ...tax,
    percentage: Number(tax.percentage) || 0,
    fixedValue: money(tax.fixedValue)
  }));
  const fixedAndScopedTaxes = money(taxes.reduce((sum, tax) => {
    if (tax.type === 'FIXO') return sum + money(tax.fixedValue);
    if (tax.base === 'DESPESAS') return sum + money(totalExpenses * tax.percentage / 100);
    if (tax.base === 'SUBTOTAL') return sum + money(subtotal * tax.percentage / 100);
    return sum;
  }, 0));
  const freightTaxRate = taxes.reduce((sum, tax) => sum + (tax.type === 'PERCENTUAL' && tax.base === 'VALOR_FRETE' ? tax.percentage / 100 : 0), 0);
  const calculateProfit = (totalCostValue: number) => input.profitType === 'FIXO' ? money(input.profitValue) : money(totalCostValue * (Number(input.profitValue) || 0) / 100);
  let totalTaxes = fixedAndScopedTaxes;
  let totalCost = money(subtotal + totalTaxes);
  let profit = calculateProfit(totalCost);
  let totalFreight = money(totalCost + profit);
  if (freightTaxRate > 0) {
    let previous = totalFreight;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const freightBasedTaxes = money(previous * freightTaxRate);
      totalTaxes = money(fixedAndScopedTaxes + freightBasedTaxes);
      totalCost = money(subtotal + totalTaxes);
      profit = calculateProfit(totalCost);
      totalFreight = money(totalCost + profit);
      if (Math.abs(totalFreight - previous) < 0.01) break;
      previous = totalFreight;
    }
  }
  const driverPassed = money(input.driverPassed);
  const driverPaid = money(input.driverPaid);
  return { totalExpenses, routeCost, tolls, insurance, lodging, assistants, subtotal, totalTaxes, totalCost, profit, totalFreight, driverPassed, driverPaid, netResult: money(totalFreight - driverPaid - totalExpenses - routeCost - tolls - insurance - lodging - assistants - totalTaxes) };
}
export function normalizeExpense(input: Partial<BudgetExpense>, index: number): BudgetExpense {
  const quantity = Number(input.quantity ?? 1); const unitPrice = money(input.unitPrice ?? input.total ?? 0);
  return { id: String(input.id || `expense-${index + 1}`), description: String(input.description || '').trim().slice(0, 160), category: String(input.category || 'OUTROS').slice(0, 60), quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : 0, unit: String(input.unit || 'un').slice(0, 30), unitPrice, total: money(quantity * unitPrice), notes: String(input.notes || '').slice(0, 500) };
}
