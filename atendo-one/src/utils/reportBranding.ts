import type { jsPDF } from 'jspdf';

export interface ReportCompanyInfo {
  name?: string;
  legalName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  responsibleName?: string;
  responsibleRole?: string;
}

export interface ReportSystemInfo {
  systemName?: string;
  footerText?: string;
  supportPhone?: string;
  supportEmail?: string;
}

export interface ResolvedReportBranding {
  companyName: string;
  companyMeta: string;
  systemName: string;
  footerText: string;
  signatureName: string;
  signatureRole: string;
}

const clean = (value: unknown): string => String(value || '').replace(/[\r\n]+/g, ' ').trim();

export const resolveReportBranding = (
  company?: ReportCompanyInfo,
  system?: ReportSystemInfo
): ResolvedReportBranding => {
  const companyName = clean(company?.legalName || company?.name) || 'Empresa não informada';
  const companyMeta = [
    company?.cnpj && `CNPJ: ${clean(company.cnpj)}`,
    company?.phone && `Tel: ${clean(company.phone)}`,
    company?.email && clean(company.email)
  ].filter(Boolean).join(' • ');
  const systemName = clean(system?.systemName) || 'Atendo One';
  const configuredFooter = clean(system?.footerText);
  const support = [system?.supportPhone && `Suporte: ${clean(system.supportPhone)}`, system?.supportEmail && clean(system.supportEmail)].filter(Boolean).join(' • ');
  const footerText = configuredFooter || `Documento emitido pelo sistema ${systemName}${support ? ` • ${support}` : ''}.`;

  return {
    companyName,
    companyMeta,
    systemName,
    footerText,
    signatureName: clean(company?.responsibleName) || companyName,
    signatureRole: clean(company?.responsibleRole) || 'Responsável pela empresa'
  };
};

export const slugForFilename = (value: string): string => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 48) || 'Atendo_One';

export const addReportFooters = (doc: jsPDF, branding: ResolvedReportBranding): void => {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const footer = `${branding.companyName} • ${branding.footerText}`;
    doc.text(footer.slice(0, 180), 105, 291, { align: 'center' });
  }
};
