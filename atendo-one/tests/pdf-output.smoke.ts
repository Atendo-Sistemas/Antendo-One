import assert from 'node:assert/strict';
import { generateExpenseReportPdf } from '../src/utils/expensePdfGenerator';
import { generateChecklistPdf } from '../src/utils/checklistPdfGenerator';

const company = {
  name: 'Empresa Fictícia Logística',
  legalName: 'Empresa Fictícia Logística Ltda.',
  cnpj: '00.000.000/0001-00',
  email: 'contato@empresa-ficticia.example',
  phone: '(11) 4000-0000',
  responsibleName: 'Empresa Fictícia Logística Ltda.',
  responsibleRole: 'Responsável pela empresa'
};
const system = {
  systemName: 'Sistema Demo Operacional',
  footerText: 'Emitido pelo Sistema Demo Operacional. Documento de demonstração.'
};

const expense = generateExpenseReportPdf({
  id: 'exp-fixture-001',
  tenantId: 'tenant-fixture',
  freightCode: 'FRT-001',
  driverName: 'Motorista de Teste',
  driverPhone: '(11) 99999-0000',
  vehiclePlate: 'ABC1D23',
  chassis: '12345678901234567',
  vehicleModel: 'Caminhão de Teste',
  clientName: 'Cliente Fictício',
  startDate: '2026-08-27',
  endDate: '2026-08-27',
  initialKm: 100,
  finalKm: 250,
  totalKm: 150,
  averageKmPerLiter: 4,
  advanceAmount: 500,
  driverLaborAmount: 100,
  totalExpenses: 300,
  items: [],
  generalNotes: '',
  status: 'ENVIADO',
  createdAt: '2026-08-27T12:00:00.000Z',
  updatedAt: '2026-08-27T12:00:00.000Z'
} as any, {
  download: false,
  company,
  system,
  template: {
    type: 'EXPENSE',
    title: 'Relatório personalizado de teste',
    subtitle: 'Modelo editado pela empresa fictícia',
    approvalLabel: 'Aprovação interna',
    signatureLabel: 'Assinatura empresarial',
    notes: 'Nota sintética do modelo'
  }
});

const checklist = generateChecklistPdf({
  id: 'response-fixture-001',
  formId: 'form-fixture',
  stage: 'COMPLETO',
  answers: {
    talaoNumber: '001',
    cliente: 'Cliente Fictício',
    veiculo: { placa: 'ABC1D23', marcaModelo: 'Veículo de Teste', chassi: '12345678901234567' },
    retirada: { km: '100', combustivel: 'OK', oleo: 'OK', bateria: 'OK' },
    equipamentos: {},
    avarias: { observacoes: 'Nenhuma' },
    origem: { assinado: true, responsavel: 'Origem de Teste' },
    entrega: { assinado: true, responsavel: 'Destino de Teste' }
  },
  createdAt: '2026-08-27T12:00:00.000Z',
  updatedAt: '2026-08-27T12:00:00.000Z'
} as any, { code: 'FRT-001', origin: { city: 'São Paulo', state: 'SP' }, destination: { city: 'Campinas', state: 'SP' } } as any, {
  download: false,
  company,
  system,
  template: {
    type: 'CHECKLIST',
    title: 'Checklist personalizado de teste',
    subtitle: 'Modelo editado pela empresa fictícia',
    approvalLabel: 'Conferência interna',
    signatureLabel: 'Assinatura empresarial',
    notes: 'Nota sintética do modelo'
  }
});

const pageText = (doc: any) => (doc.internal.pages as string[][]).flat().join('\n');
for (const [name, doc] of [['expense', expense.doc], ['checklist', checklist.doc]] as const) {
  const text = pageText(doc);
  assert.match(text, /Empresa Fictícia Logística Ltda\./, `${name} não contém a empresa`);
  assert.match(text, /00\.000\.000\/0001-00/, `${name} não contém o CNPJ`);
  assert.match(text, /Sistema Demo Operacional/, `${name} não contém o SaaS`);
  assert.match(text, /Nota sintética do modelo/, `${name} não contém a cópia editada`);
  assert.doesNotMatch(text, /ELO LOG|ELOLOG/, `${name} contém marca fixa legada`);
}
assert.match(expense.filename, /Empresa_Ficticia_Logistica_Ltda/);
assert.match(checklist.filename, /Empresa_Ficticia_Logistica_Ltda/);
console.log('pdf-output smoke: ok');
