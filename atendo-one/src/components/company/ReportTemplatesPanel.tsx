import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Lock, Save } from 'lucide-react';
import { api } from '../../services/api';
import { TenantReportTemplate, ReportTemplateType } from '../../types';
import { useSaaS } from '../../context/SaaSContext';

const reportLabels: Record<ReportTemplateType, { label: string; description: string }> = {
  EXPENSE: {
    label: 'Prestação de contas',
    description: 'Despesas de viagem, adiantamentos, saldo e assinatura da empresa.'
  },
  CHECKLIST: {
    label: 'Checklist e vistoria',
    description: 'Retirada, entrega, condições do veículo e assinaturas digitais.'
  }
};

export const ReportTemplatesPanel: React.FC = () => {
  const { config } = useSaaS();
  const [templates, setTemplates] = useState<TenantReportTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<ReportTemplateType>('EXPENSE');
  const [draft, setDraft] = useState<TenantReportTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.type === selectedType) || null,
    [templates, selectedType]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getTenantReportTemplates()
      .then(data => {
        if (cancelled) return;
        setTemplates(data);
        setDraft(data.find(template => template.type === selectedType) || data[0] || null);
      })
      .catch(error => {
        if (!cancelled) setToast({ type: 'error', message: error?.message || 'Não foi possível carregar os modelos.' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedType]);

  useEffect(() => {
    if (selectedTemplate) setDraft(selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateDraft = (field: keyof Pick<TenantReportTemplate, 'title' | 'subtitle' | 'approvalLabel' | 'signatureLabel' | 'notes'>, value: string) => {
    setDraft(current => current ? { ...current, [field]: value } : current);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await api.updateTenantReportTemplate(selectedType, {
        title: draft.title,
        subtitle: draft.subtitle,
        approvalLabel: draft.approvalLabel,
        signatureLabel: draft.signatureLabel,
        notes: draft.notes
      });
      setTemplates(current => current.map(template => template.type === selectedType ? saved : template));
      setDraft(saved);
      setToast({ type: 'success', message: 'Cópia do modelo salva para esta empresa.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Não foi possível salvar o modelo.' });
    } finally {
      setSaving(false);
    }
  };

  const systemName = config?.systemName || config?.layout?.logoText || 'Atendo One';

  return (
    <div className="space-y-6 animate-in fade-in">
      {toast && (
        <div role="alert" className={`fixed bottom-5 right-5 z-[80] w-[min(92vw,24rem)] rounded-2xl border px-4 py-3 shadow-2xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
          <div className="flex items-start gap-3">
            {toast.type === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
            <p className="flex-1 text-sm font-semibold">{toast.message}</p>
            <button type="button" onClick={() => setToast(null)} className="text-xs font-bold opacity-70 hover:opacity-100" aria-label="Fechar aviso">Fechar</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.18em]">Modelos de relatórios</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Personalize a cópia da sua empresa</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">Edite os textos de apresentação e aprovação dos novos relatórios. A cópia salva fica isolada neste tenant e será aplicada nas próximas emissões.</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Identidade legal e rodapé do sistema são obrigatórios.</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="px-2 pb-3 text-xs font-black uppercase tracking-wider text-slate-400">Escolha o relatório</p>
          <div className="space-y-2">
            {(Object.keys(reportLabels) as ReportTemplateType[]).map(type => {
              const option = reportLabels[type];
              const active = type === selectedType;
              return (
                <button key={type} type="button" onClick={() => setSelectedType(type)} className={`w-full rounded-xl border p-4 text-left transition-all ${active ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/30' : 'border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-700'}`}>
                  <span className={`block text-sm font-extrabold ${active ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>{option.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {loading || !draft ? (
            <div className="py-12 text-center text-sm text-slate-500">Carregando modelo da empresa...</div>
          ) : (
            <>
              <div className="grid gap-4">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Título do relatório
                  <input value={draft.title} maxLength={140} onChange={event => updateDraft('title', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Subtítulo
                  <input value={draft.subtitle} maxLength={240} onChange={event => updateDraft('subtitle', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Título da aprovação
                  <input value={draft.approvalLabel} maxLength={140} onChange={event => updateDraft('approvalLabel', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Legenda da assinatura empresarial
                  <input value={draft.signatureLabel} maxLength={140} onChange={event => updateDraft('signatureLabel', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Observação adicional opcional
                  <textarea value={draft.notes} maxLength={500} rows={3} onChange={event => updateDraft('notes', event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prévia protegida</p>
                <h2 className="mt-2 text-base font-black text-slate-900 dark:text-white">{draft.title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{draft.subtitle}</p>
                <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <p><strong>Empresa:</strong> Nome/razão social, CNPJ e contatos do cadastro empresarial</p>
                  <p className="mt-1"><strong>Assinatura:</strong> {draft.signatureLabel}</p>
                  <p className="mt-1 text-slate-500"><strong>Rodapé bloqueado:</strong> emitido pelo sistema {systemName}</p>
                </div>
              </div>

              <button type="button" disabled={saving} onClick={handleSave} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar cópia da empresa'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
