import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, Webhook } from 'lucide-react';
import { AsaasConfig, SaaSGlobalConfig, Tenant } from '../../types';
import { api } from '../../services/api';

interface Props {
  config: SaaSGlobalConfig;
  onUpdateConfig: (updated: Partial<SaaSGlobalConfig>) => Promise<void>;
  saving: boolean;
}

const emptyConfig: AsaasConfig = {
  enabled: false,
  environment: 'sandbox',
  apiKey: '',
  webhookToken: '',
  webhookUrl: ''
};

export const AsaasConfigPanel: React.FC<Props> = ({ config, onUpdateConfig, saving }) => {
  const current = { ...emptyConfig, ...(config.asaasConfig || {}) };
  const [draft, setDraft] = useState<AsaasConfig>(current);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookToken, setShowWebhookToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [billingTenantId, setBillingTenantId] = useState('');
  const [billingPlanId, setBillingPlanId] = useState(config.plans[0]?.id || '');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [billingType, setBillingType] = useState('PIX');
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState('');
  const [subscriptionView, setSubscriptionView] = useState<any>(null);

  const update = (patch: Partial<AsaasConfig>) => setDraft(prev => ({ ...prev, ...patch }));
  useEffect(() => { void api.getTenants().then(items => { setTenants(items); if (!billingTenantId && items[0]) setBillingTenantId(items[0].id); }).catch(() => {}); }, []);
  useEffect(() => { if (!billingPlanId && config.plans[0]) setBillingPlanId(config.plans[0].id); }, [config.plans, billingPlanId]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await onUpdateConfig({ asaasConfig: draft });
  };
  const manageSubscription = async (action: 'create' | 'view') => {
    if (!billingTenantId) { setBillingMessage('Selecione uma empresa.'); return; }
    setBillingBusy(true); setBillingMessage('');
    try {
      if (action === 'create') {
        const result = await api.createAsaasSubscription({ tenantId: billingTenantId, planId: billingPlanId, cycle: billingCycle, billingType });
        setBillingMessage(`Assinatura criada: ${result.id} (${result.status || 'PENDENTE'}).`);
      } else {
        const result = await api.getAsaasSubscription(billingTenantId);
        setSubscriptionView(result);
        setBillingMessage(result.subscription ? `Status atual: ${result.subscription.status}.` : 'Nenhuma assinatura encontrada para a empresa.');
      }
    } catch (error: any) { setBillingMessage(error.message || 'Não foi possível concluir a operação Asaas.'); }
    finally { setBillingBusy(false); }
  };
  const testConnection = async () => {
    setTesting(true); setTestMessage('');
    try { const result = await api.testAsaasConnection(); setTestMessage(`Conexão confirmada: ${result.accountName} (${result.environment}).`); }
    catch (error: any) { setTestMessage(error.message || 'Não foi possível validar a conexão Asaas.'); }
    finally { setTesting(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-600" /> Pagamentos Asaas
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">Configure a cobrança dos planos SaaS. A chave nunca é exibida novamente nem gravada no snapshot JSONB.</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/60 p-4 text-xs text-amber-900 dark:text-amber-200">
        <p className="font-bold">Procedimento seguro</p>
        <p className="mt-1">Use Sandbox para os testes. A API Asaas usa o cabeçalho <code>access_token</code>; não envie a chave para o navegador nem para logs.</p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer">
        <input type="checkbox" checked={draft.enabled} onChange={e => update({ enabled: e.target.checked })} />
        <span><strong className="block text-sm text-slate-800 dark:text-white">Ativar pagamentos Asaas</strong><span className="text-xs text-slate-500">Permite criar cobranças para planos contratados.</span></span>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Ambiente
          <select value={draft.environment} onChange={e => update({ environment: e.target.value as AsaasConfig['environment'] })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm">
            <option value="sandbox">Sandbox — testes</option>
            <option value="production">Produção — cobranças reais</option>
          </select>
        </label>
        <div className="text-xs text-slate-500 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
          URL usada: <code>{draft.environment === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'}</code>
        </div>
      </div>

      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">API Key
        <div className="relative mt-1">
          <input type={showApiKey ? 'text' : 'password'} value={draft.apiKey} onChange={e => update({ apiKey: e.target.value })} placeholder="Deixe vazio para manter a chave atual" autoComplete="new-password" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm font-mono" />
          <button type="button" onClick={() => setShowApiKey(v => !v)} className="absolute right-2 top-2 text-slate-400" aria-label="Exibir ou ocultar API Key">{showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
      </label>

      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Token de autenticação do webhook
        <div className="relative mt-1">
          <input type={showWebhookToken ? 'text' : 'password'} value={draft.webhookToken} onChange={e => update({ webhookToken: e.target.value })} placeholder="Mínimo recomendado: 32 caracteres" autoComplete="new-password" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm font-mono" />
          <button type="button" onClick={() => setShowWebhookToken(v => !v)} className="absolute right-2 top-2 text-slate-400" aria-label="Exibir ou ocultar token do webhook">{showWebhookToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
      </label>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-xs text-slate-500 space-y-2">
        <p className="flex items-center gap-2"><Webhook className="w-4 h-4" /> Endpoint para cadastrar no Asaas:</p>
        <code className="block break-all text-slate-700 dark:text-slate-200">{draft.webhookUrl || `${window.location.origin}/api/webhooks/asaas`}</code>
        <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Eventos são aceitos com idempotência por identificador.</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <div><h4 className="text-sm font-black text-slate-800 dark:text-white">Assinatura recorrente dos planos</h4><p className="text-[11px] text-slate-500 mt-1">A criação só ocorre ao clicar no botão. O status do plano é atualizado pelos webhooks autenticados do Asaas após confirmação da cobrança.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="block font-bold text-slate-600 dark:text-slate-300">Empresa<select value={billingTenantId} onChange={e => setBillingTenantId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"><option value="">Selecione uma empresa</option>{tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>
          <label className="block font-bold text-slate-600 dark:text-slate-300">Plano<select value={billingPlanId} onChange={e => setBillingPlanId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm">{config.plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} — R$ {Number(plan.price).toFixed(2)}</option>)}</select></label>
          <label className="block font-bold text-slate-600 dark:text-slate-300">Ciclo<select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"><option value="MONTHLY">Mensal</option><option value="QUARTERLY">Trimestral</option><option value="SEMIANNUALLY">Semestral</option><option value="YEARLY">Anual</option></select></label>
          <label className="block font-bold text-slate-600 dark:text-slate-300">Forma de cobrança<select value={billingType} onChange={e => setBillingType(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"><option value="PIX">PIX</option><option value="BOLETO">Boleto</option></select><span className="mt-1 block text-[11px] font-normal text-slate-500">Cartão deve ser concluído pelo Checkout Asaas ou por tokenização segura.</span></label>
        </div>
        {billingMessage && <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">{billingMessage}</div>}
        {subscriptionView?.subscription && <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">Assinatura: <strong>{subscriptionView.subscription.id}</strong> · Status: <strong>{subscriptionView.subscription.status}</strong> · Próximo vencimento: {subscriptionView.subscription.nextDueDate || 'não informado'}</div>}
        <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void manageSubscription('view')} disabled={billingBusy || !billingTenantId} className="px-4 py-2.5 border border-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">Consultar status</button><button type="button" onClick={() => void manageSubscription('create')} disabled={billingBusy || !billingTenantId || !billingPlanId || !draft.enabled} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">{billingBusy ? 'Processando...' : 'Criar assinatura'}</button></div>
      </div>
      {testMessage && <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">{testMessage}</div>}
      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => void testConnection()} disabled={testing || saving} className="px-4 py-2.5 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold disabled:opacity-50">{testing ? 'Testando...' : 'Testar conexão'}</button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saving ? 'Gravando...' : 'Salvar configuração Asaas'}
        </button>
      </div>
    </form>
  );
};
