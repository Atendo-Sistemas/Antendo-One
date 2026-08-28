import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, CreditCard, MessageCircle, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { api } from '../../services/api';
import { WhatsAppConfigModal } from '../common/WhatsAppConfigModal';

const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const statusLabel: Record<string, string> = { ACTIVE: 'Ativa', PENDING: 'Pendente', OVERDUE: 'Em atraso', INACTIVE: 'Inativa', CANCELED: 'Cancelada', RECEIVED: 'Recebida', CONFIRMED: 'Confirmada', FAILED: 'Falhou' };

interface CompanyBillingPanelProps {
  onOpenNotificationTemplates?: () => void;
}

export const CompanyBillingPanel: React.FC<CompanyBillingPanelProps> = ({ onOpenNotificationTemplates }) => {
  const { tenant } = useAuth();
  const { config } = useSaaS();
  const [summary, setSummary] = useState<any>(null);
  const [moduleStatus, setModuleStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(tenant?.plan || config?.plans?.[0]?.id || 'BASICO');
  const [cycle, setCycle] = useState('MONTHLY');
  const [billingType, setBillingType] = useState('PIX');
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const availablePlans = useMemo(() => (config?.plans || []).filter(plan => plan.isActive !== false), [config?.plans]);
  const hasSubscription = Boolean(summary?.subscription?.id);
  const currentStatus = summary?.billingStatus || 'PENDING';
  const canManage = hasSubscription && ['ACTIVE', 'PENDING', 'OVERDUE'].includes(String(summary?.subscription?.status || currentStatus).toUpperCase());

  const refresh = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [financial, module] = await Promise.all([
        api.getAsaasFinancialSummary(tenant.id),
        api.getNotificationModuleStatus(tenant.id).catch(() => null)
      ]);
      setSummary(financial);
      setModuleStatus(module);
      setSelectedPlanId(financial.plan || tenant.plan);
      setCycle(financial.subscription?.cycle || 'MONTHLY');
      setBillingType(financial.subscription?.billingType === 'CREDIT_CARD' ? 'PIX' : (financial.subscription?.billingType || 'PIX'));
      setMessage('');
    } catch (error: any) {
      setMessage(error?.message || 'Não foi possível carregar o financeiro da empresa.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [tenant?.id]);

  const createOrChange = async () => {
    if (!tenant?.id || !selectedPlanId) return;
    setBusy(true);
    setMessage('');
    try {
      if (hasSubscription && selectedPlanId !== summary.plan) {
        await api.changeAsaasPlan({ tenantId: tenant.id, planId: selectedPlanId, cycle, billingType, updatePendingPayments: false });
        setMessage('Plano alterado. As cobranças pendentes foram preservadas; a nova configuração vale para as próximas cobranças.');
      } else {
        await api.createAsaasSubscription({ tenantId: tenant.id, planId: selectedPlanId, cycle, billingType });
        setMessage('Assinatura criada. O acesso comercial será atualizado após a confirmação do pagamento pelo webhook.');
      }
      await refresh();
    } catch (error: any) {
      setMessage(error?.message || 'Não foi possível concluir a operação de assinatura.');
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!tenant?.id || !window.confirm('Cancelar definitivamente a assinatura principal? As cobranças futuras da recorrência serão interrompidas.')) return;
    setBusy(true);
    setMessage('Cancelando assinatura...');
    try {
      await api.cancelAsaasSubscription(tenant.id);
      setMessage('Assinatura cancelada. O histórico local foi preservado.');
      await refresh();
    } catch (error: any) {
      setMessage(error?.message || 'Não foi possível cancelar a assinatura.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 flex items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw className="w-5 h-5 animate-spin" /> Carregando dados financeiros...</div>;

  return (
    <section className="space-y-6" aria-labelledby="company-billing-title">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 p-6 text-white shadow-lg"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Conta da empresa</p><h1 id="company-billing-title" className="mt-1 text-2xl font-black">Assinatura e financeiro</h1><p className="mt-1 text-sm text-indigo-100">Gerencie o plano, acompanhe cobranças e mantenha o histórico em um único lugar.</p></div><CreditCard className="h-8 w-8 text-indigo-200" /></div></div>
      {message && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">{message}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><p className="text-xs text-slate-500">Plano atual</p><p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{summary?.plan || tenant?.plan || '—'}</p></div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><p className="text-xs text-slate-500">Status</p><p className="mt-1 text-lg font-black text-indigo-700 dark:text-indigo-300">{statusLabel[currentStatus] || currentStatus}</p></div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><p className="text-xs text-slate-500">Recebido</p><p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">{money(summary?.totals?.received)}</p></div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><p className="text-xs text-slate-500">Pendente / em atraso</p><p className="mt-1 text-lg font-black text-amber-700 dark:text-amber-300">{money((summary?.totals?.pending || 0) + (summary?.totals?.overdue || 0))}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5"><div><h2 className="text-base font-black text-slate-900 dark:text-white">Plano e forma de cobrança</h2><p className="mt-1 text-xs text-slate-500">A troca altera o valor das próximas cobranças. Por segurança, o Gestor não coleta número de cartão ou CVV.</p></div><div className="grid gap-3 sm:grid-cols-2">{availablePlans.map(plan => <button type="button" key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`rounded-xl border p-4 text-left transition-colors ${selectedPlanId === plan.id ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}><span className="text-xs font-bold text-slate-500">{plan.name}</span><span className="mt-1 block text-xl font-black text-slate-900 dark:text-white">{money(plan.price)}<small className="text-xs font-medium text-slate-500">/mês</small></span><span className="mt-2 block text-[11px] text-slate-500">Até {plan.maxUsers} usuários · {plan.maxDrivers} motoristas</span></button>)}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Ciclo<select value={cycle} onChange={event => setCycle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"><option value="MONTHLY">Mensal</option><option value="QUARTERLY">Trimestral</option><option value="SEMIANNUALLY">Semestral</option><option value="YEARLY">Anual</option></select></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Forma<select value={billingType} onChange={event => setBillingType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"><option value="PIX">PIX</option><option value="BOLETO">Boleto</option></select></label></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void createOrChange()} disabled={busy || (!canManage && hasSubscription) || !selectedPlanId} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}{hasSubscription ? 'Salvar troca de plano' : 'Criar assinatura'}</button>{hasSubscription && <button type="button" onClick={() => void cancel()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 disabled:opacity-50"><XCircle className="h-4 w-4" /> Cancelar assinatura</button>}</div></div>
        <div className="space-y-4"><div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20 p-5"><div className="flex items-start gap-3"><MessageCircle className="h-5 w-5 text-indigo-600" /><div><h2 className="text-base font-black text-indigo-950 dark:text-indigo-100">WhatsApp da empresa</h2><p className="mt-1 text-xs text-indigo-900/70 dark:text-indigo-200/70">{moduleStatus?.plan === 'OWN_NUMBER' ? `Número próprio: ${statusLabel[moduleStatus.billingStatus] || moduleStatus.billingStatus}.` : 'Telefone SaaS selecionado, sem mensalidade adicional.'}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setWhatsappOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">Gerenciar canal e consentimento</button>{moduleStatus?.canUseOwnNumber && onOpenNotificationTemplates && <button type="button" onClick={onOpenNotificationTemplates} className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-950/40">Editar mensagens</button>}</div></div><div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><div className="flex items-start gap-3"><ShieldCheck className="h-5 w-5 text-emerald-600" /><div><h2 className="text-base font-black text-slate-900 dark:text-white">Segurança financeira</h2><p className="mt-1 text-xs text-slate-500">Links de pagamento são gerados pelo Asaas. O Gestor mantém apenas status, valores e referências necessárias à conciliação.</p></div></div></div></div>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5"><div><h2 className="text-base font-black text-slate-900 dark:text-white">Histórico de cobranças</h2><p className="mt-1 text-xs text-slate-500">Últimas cobranças sincronizadas pelos webhooks autenticados.</p></div><button type="button" onClick={() => void refresh()} disabled={loading || busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" /> Atualizar</button></div>{summary?.payments?.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500"><tr><th className="px-5 py-3 font-bold">Vencimento</th><th className="px-5 py-3 font-bold">Valor</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Ação</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{summary.payments.map((payment: any) => <tr key={payment.id}><td className="px-5 py-3 text-slate-600 dark:text-slate-300">{payment.dueDate || '—'}</td><td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{money(payment.value)}</td><td className="px-5 py-3"><span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">{['RECEIVED', 'CONFIRMED'].includes(String(payment.status).toUpperCase()) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}{statusLabel[payment.status] || payment.status}</span></td><td className="px-5 py-3">{payment.invoiceUrl ? <a href={payment.invoiceUrl} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline">Abrir cobrança</a> : '—'}</td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-slate-500">Nenhuma cobrança sincronizada para esta empresa.</div>}</div>
      {whatsappOpen && <WhatsAppConfigModal isOpen={whatsappOpen} onClose={() => setWhatsappOpen(false)} tenantId={tenant?.id} />}
    </section>
  );
};
