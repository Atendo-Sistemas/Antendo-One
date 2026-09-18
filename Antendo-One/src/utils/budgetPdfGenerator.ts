import { jsPDF } from 'jspdf';
import { Budget } from '../types';

const brl = (value: unknown) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function generateBudgetPdf(budget: Budget): { doc: jsPDF; filename: string } {
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18); doc.text('Orçamento de Transporte', 15, y); y += 10;
  doc.setFontSize(10); doc.text(`Código: ${budget.code}`, 15, y); doc.text(`Data: ${budget.date || '-'}`, 120, y); y += 8;
  doc.text(`Cliente: ${budget.clientName || '-'}`, 15, y); y += 8;
  doc.text(`Origem: ${budget.origin?.address || '-'} — ${budget.origin?.city || ''}/${budget.origin?.state || ''}`, 15, y); y += 6;
  doc.text(`Destino: ${budget.destination?.address || '-'} — ${budget.destination?.city || ''}/${budget.destination?.state || ''}`, 15, y); y += 8;
  doc.text(`Distância: ${budget.distanceKm || 0} km   |   Valor/km: ${brl(budget.pricePerKm)}`, 15, y); y += 12;
  doc.setFontSize(12); doc.text('Despesas', 15, y); y += 7; doc.setFontSize(10);
  for (const expense of budget.expenses || []) { if (y > 270) { doc.addPage(); y = 20; } doc.text(`${expense.description} (${expense.quantity} ${expense.unit})`, 15, y); doc.text(brl(expense.total), 155, y); y += 6; }
  y += 5; doc.line(15, y, 195, y); y += 8;
  const financials = budget.financials || ({} as any);
  for (const [label, value] of [['Custo da rota', financials.routeCost], ['Pedágios', financials.tolls], ['Seguro', financials.insurance], ['Diárias', financials.lodging], ['Ajudantes', financials.assistants], ['Despesas', financials.totalExpenses], ['Impostos', financials.totalTaxes], ['Lucro', financials.profit], ['Total do frete', financials.totalFreight]] as Array<[string, unknown]>) { doc.text(label, 15, y); doc.text(brl(value), 155, y); y += 7; }
  y += 8; doc.setFontSize(8); doc.text('Documento gerado pelo Atendo One. Valores sujeitos à aprovação e validade comercial.', 15, y);
  return { doc, filename: `orcamento-${budget.code}.pdf` };
}
