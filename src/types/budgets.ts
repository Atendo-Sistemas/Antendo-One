export type BudgetStatus = 'RASCUNHO' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO' | 'CANCELADO' | 'CONVERTIDO';
export type BudgetProfitType = 'PERCENTUAL' | 'FIXO';
export type BudgetTaxType = 'PERCENTUAL' | 'FIXO';
export type BudgetTaxBase = 'DESPESAS' | 'SUBTOTAL' | 'VALOR_FRETE';
export type DriverValueVisibility = 'TOTAL_FRETE' | 'PASSADO_MOTORISTA' | 'PAGO_MOTORISTA' | 'NAO_EXIBIR';
export interface BudgetExpense { id: string; description: string; category: string; quantity: number; unit: string; unitPrice: number; total: number; notes?: string; }
export interface BudgetTax { id: string; name: string; type: BudgetTaxType; percentage?: number; fixedValue?: number; base: BudgetTaxBase; }
export interface BudgetFinancials { totalExpenses: number; routeCost?: number; tolls?: number; insurance?: number; lodging?: number; assistants?: number; subtotal: number; totalTaxes: number; totalCost: number; profit: number; totalFreight: number; driverPassed: number; driverPaid: number; netResult: number; }
export interface BudgetVersion { id: string; budgetId: string; version: number; snapshot: Record<string, unknown>; createdAt: string; createdByUserId: string; approvedAt?: string; }
export interface Budget {
  id: string; tenantId: string; code: string; status: BudgetStatus; version: number; clientName: string; clientId?: string;
  origin: Record<string, any>; destination: Record<string, any>; date: string; cargoType: string; weightKg: number; quantity: number;
  vehicleType?: string; driverId?: string; distanceKm: number; pricePerKm?: number; priceTableReference?: string; tolls?: number; insurance?: number; dailyRate?: number; dailyCount?: number; assistantCount?: number; assistantDailyRate?: number; estimatedMinutes: number; notes?: string;
  expenses: BudgetExpense[]; taxes: BudgetTax[]; profitType: BudgetProfitType; profitValue: number;
  driverPassed: number; driverPaid: number; financials: BudgetFinancials; customFields: Record<string, unknown>;
  versions: BudgetVersion[]; convertedFreightId?: string; createdAt: string; updatedAt: string;
}
export interface BudgetFormField { id: string; key: string; label: string; type: 'TEXT'|'NUMBER'|'CURRENCY'|'PERCENTAGE'|'DATE'|'TIME'|'SELECT'|'CHECKBOX'|'TEXTAREA'|'QUANTITY'|'UNIT_PRICE'|'CALCULATED'; active: boolean; required: boolean; defaultValue?: unknown; category?: string; formula?: string; order: number; }
export interface TenantBudgetForm { id: string; tenantId: string; kind: 'BUDGET'|'EXPENSE'; version: number; fields: BudgetFormField[]; active: boolean; updatedAt: string; }
