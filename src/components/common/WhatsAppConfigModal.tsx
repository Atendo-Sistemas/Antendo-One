import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { NotificationModuleStatus, Tenant, WhatsAppConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  MessageCircle,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Globe,
  Phone,
  Sliders,
  Radio,
  Code2,
  Building2,
  QrCode,
  Wifi,
  WifiOff
} from 'lucide-react';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
}

type SafeWhatsAppConfig = WhatsAppConfig & {
  tokenMasked?: string;
  tenantId?: string | null;
  scope?: 'GLOBAL' | 'TENANT';
  tenantHasDedicatedConfig?: boolean;
};

const statusLabel: Record<string, string> = {
  UNKNOWN: 'Não consultado',
  DISCONNECTED: 'Desconectado',
  QR_AVAILABLE: 'QR Code disponível',
  PAIRING_CODE_AVAILABLE: 'Código de pareamento disponível',
  PENDING: 'Aguardando resposta do canal',
  CONNECTED: 'Conectado',
  ERROR: 'Erro de comunicação'
};

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({ isOpen, onClose, tenantId }) => {
  const { user, tenant } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [companies, setCompanies] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId || tenant?.id || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [requestingQr, setRequestingQr] = useState(false);
  const [testing, setTesting] = useState(false);

  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [defaultChannelNumber, setDefaultChannelNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [autoNotifyChecklist, setAutoNotifyChecklist] = useState(true);
  const [autoNotifyFreightStatus, setAutoNotifyFreightStatus] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('UNKNOWN');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [moduleStatus, setModuleStatus] = useState<NotificationModuleStatus | null>(null);
  const [moduleBusy, setModuleBusy] = useState(false);
  const [moduleMessage, setModuleMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const pollingDeadlineRef = useRef(0);

  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Mensagem de teste do sistema Gestor.');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    recipient?: string;
    details?: any;
  } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const initialTenantId = tenantId || tenant?.id || '';
    setSelectedTenantId(initialTenantId);
    setQrCode('');
    setPairingCode('');
    setQrExpiresAt(null);
    setConnectionMessage('');
    setTestResult(null);

    if (!isSuperAdmin) {
      setCompanies([]);
      return;
    }

    api.getTenants()
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, [isOpen, tenantId, tenant?.id, isSuperAdmin]);

  useEffect(() => {
    if (!isOpen || !selectedTenantId) {
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [isOpen, selectedTenantId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadConfig = async () => {
      setLoading(true);
      setQrCode('');
      setPairingCode('');
      setQrExpiresAt(null);
      setConnectionMessage('');
      try {
        const [config, module] = await Promise.all([
          api.getWhatsAppConfig(selectedTenantId || undefined) as Promise<SafeWhatsAppConfig>,
          selectedTenantId ? api.getNotificationModuleStatus(selectedTenantId) : Promise.resolve(null)
        ]);
        if (cancelled) return;
        setBaseUrl(config.baseUrl || '');
        setToken('');
        setTokenSaved(Boolean(config.tokenMasked));
        setDefaultChannelNumber(config.defaultChannelNumber || '');
        setIsActive(config.isActive !== undefined ? config.isActive : true);
        setAutoNotifyChecklist(config.autoNotifyChecklist !== undefined ? config.autoNotifyChecklist : true);
        setAutoNotifyFreightStatus(config.autoNotifyFreightStatus !== undefined ? config.autoNotifyFreightStatus : true);
        setConnectionStatus(config.connectionStatus || 'UNKNOWN');
        setConnectionMessage(config.lastConnectionError || '');
        setModuleStatus(module);
        setModuleMessage('');
      } catch (err: any) {
        if (!cancelled) setConnectionMessage(err.message || 'Erro ao carregar configurações do WhatsApp.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadConfig();
    return () => { cancelled = true; };
  }, [isOpen, selectedTenantId]);

  if (!isOpen) return null;

  const selectedCompany = companies.find(company => company.id === selectedTenantId);
  const scopeLabel = selectedTenantId ? (selectedCompany?.name || 'Empresa selecionada') : 'Configuração global';
  const qrImage = qrCode.startsWith('data:image/') ? qrCode : `data:image/png;base64,${qrCode}`;
  const canRequestConnectionCode = !isSuperAdmin || Boolean(selectedTenantId);

  const stopStatusPolling = () => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const applyConnectionResult = (result: { status: string; message: string; qrCode?: string; pairingCode?: string }) => {
    if (result.qrCode) {
      setQrCode(result.qrCode);
      setQrExpiresAt(Date.now() + 60 * 1000);
    }
    if (result.pairingCode) setPairingCode(result.pairingCode);
    setConnectionStatus(result.status || 'UNKNOWN');
    setConnectionMessage(result.message || 'Status do canal atualizado.');
    if (result.qrCode || result.pairingCode || result.status === 'CONNECTED') {
      stopStatusPolling();
      setRequestingQr(false);
    }
  };

  const startStatusPolling = () => {
    stopStatusPolling();
    pollingDeadlineRef.current = Date.now() + 60 * 1000;
    let inFlight = false;
    const poll = async () => {
      if (inFlight || !isOpen || Date.now() >= pollingDeadlineRef.current) {
        if (Date.now() >= pollingDeadlineRef.current) {
          stopStatusPolling();
          setRequestingQr(false);
          setConnectionMessage('O canal ainda não retornou o código. Tente novamente após conferir a conexão configurada.');
        }
        return;
      }
      inFlight = true;
      try {
        const result = await api.getWhatsAppStatus(selectedTenantId || undefined);
        if (isOpen) applyConnectionResult(result);
      } catch (err: any) {
        if (isOpen) setConnectionMessage(err.message || 'Aguardando resposta do canal WhatsApp.');
      } finally {
        inFlight = false;
      }
    };
    void poll();
    pollingRef.current = window.setInterval(() => { void poll(); }, 2500);
  };

  const handleSelectFreeModule = async () => {
    if (!selectedTenantId) return;
    setModuleBusy(true);
    setModuleMessage('');
    try {
      const result = await api.selectFreeNotificationModule(selectedTenantId);
      setModuleStatus(result);
      setModuleMessage('Plano gratuito selecionado. As notificações usarão o telefone SaaS.');
    } catch (err: any) {
      setModuleMessage(err.message || 'Não foi possível selecionar o plano gratuito.');
    } finally {
      setModuleBusy(false);
    }
  };

  const handleSubscribeOwnNumber = async () => {
    if (!selectedTenantId) return;
    setModuleBusy(true);
    setModuleMessage('Criando a assinatura pendente no Asaas...');
    try {
      const result = await api.createNotificationModuleSubscription({ tenantId: selectedTenantId, billingType: 'PIX' });
      setModuleStatus(prev => prev ? { ...prev, plan: 'OWN_NUMBER', billingStatus: 'PENDING', subscriptionId: result.id, nextDueDate: result.nextDueDate, canUseOwnNumber: false } : prev);
      setModuleMessage('Assinatura criada no Asaas. O número próprio será liberado após confirmação do pagamento pelo webhook.');
    } catch (err: any) {
      setModuleMessage(err.message || 'Não foi possível criar a assinatura do módulo.');
    } finally {
      setModuleBusy(false);
    }
  };

  const handleCancelOwnNumber = async () => {
    if (!selectedTenantId || !window.confirm('Cancelar o módulo de número próprio e retornar ao telefone SaaS? Cobranças futuras serão interrompidas no Asaas.')) return;
    setModuleBusy(true);
    setModuleMessage('Cancelando o módulo no Asaas...');
    try {
      const result = await api.cancelNotificationModule(selectedTenantId);
      setModuleStatus(prev => prev ? { ...prev, plan: 'SAAS_FREE', billingStatus: result.billingStatus || 'CANCELED', subscriptionId: undefined, nextDueDate: undefined, canUseOwnNumber: false } : prev);
      setModuleMessage('Módulo cancelado. As notificações voltarão a usar o telefone SaaS após salvar a configuração do canal.');
    } catch (err: any) {
      setModuleMessage(err.message || 'Não foi possível cancelar o módulo.');
    } finally {
      setModuleBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccessMsg('');
    try {
      await api.updateWhatsAppConfig({
        ...(selectedTenantId ? { tenantId: selectedTenantId } : {}),
        baseUrl: baseUrl.trim(),
        token: token.trim(),
        defaultChannelNumber: defaultChannelNumber.trim(),
        isActive,
        autoNotifyChecklist,
        autoNotifyFreightStatus
      });
      setToken('');
      setTokenSaved(true);
      setSaveSuccessMsg('Configuração salva com segurança.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações do WhatsApp');
    } finally {
      setSaving(false);
    }
  };

  const handleGetStatus = async () => {
    setCheckingStatus(true);
    setConnectionMessage('');
    try {
      const result = await api.getWhatsAppStatus(selectedTenantId || undefined);
      applyConnectionResult(result);
    } catch (err: any) {
      setConnectionStatus('ERROR');
      setConnectionMessage(err.message || 'Não foi possível consultar o status do canal.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRequestQr = async (usePairingCode = false) => {
    if (!canRequestConnectionCode) {
      setConnectionStatus('ERROR');
      setConnectionMessage('Selecione a empresa que possui o canal configurado antes de solicitar QR ou código de pareamento.');
      return;
    }
    if (usePairingCode && !defaultChannelNumber.trim()) {
      setConnectionStatus('ERROR');
      setConnectionMessage('Informe o número do WhatsApp no campo de conexão para gerar o código de pareamento.');
      return;
    }
    setRequestingQr(true);
    stopStatusPolling();
    setQrCode('');
    setPairingCode('');
    setQrExpiresAt(null);
    setConnectionMessage(usePairingCode ? 'Solicitando código de pareamento ao Atendo CRM...' : 'Solicitando QR Code ao Atendo CRM...');
    try {
      const result = await api.requestWhatsAppQr(selectedTenantId || undefined, usePairingCode ? defaultChannelNumber : undefined);
      applyConnectionResult(result);
      if (!result.qrCode && !result.pairingCode) {
        setConnectionStatus(result.status || 'PENDING');
        setConnectionMessage(result.message || 'Solicitação aceita. Aguardando o canal retornar o código...');
        startStatusPolling();
      }
    } catch (err: any) {
      setConnectionStatus('ERROR');
      setConnectionMessage(err.message || 'Não foi possível solicitar o código de conexão.');
      setRequestingQr(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone) {
      alert('Informe o número de telefone de destino para o teste.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testWhatsAppConnection({
        phone: testPhone,
        message: testMessage,
        ...(selectedTenantId ? { tenantId: selectedTenantId } : {}),
        baseUrl: baseUrl.trim(),
        token: token.trim()
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Falha ao testar conexão com o Gateway' });
    } finally {
      setTesting(false);
    }
  };

  const handleClose = () => {
    stopStatusPolling();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl"><MessageCircle className="w-6 h-6 text-emerald-200" /></div>
            <div>
              <h2 className="text-lg font-bold">WhatsApp por empresa</h2>
              <p className="text-xs text-emerald-100">Configuração Atendo CRM, conexão por QR Code e notificações</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[78vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /><p className="text-sm font-medium">Carregando configuração do canal...</p></div>
          ) : (
            <>
              {isSuperAdmin && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200"><Building2 className="inline w-4 h-4 mr-1" /> Empresa que receberá esta configuração</label>
                  <select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                    <option value="">Configuração global (fallback; sem canal de empresa selecionado)</option>
                    {companies.map(company => <option key={company.id} value={company.id}>{company.name} — {company.cnpj}</option>)}
                  </select>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">A URL e o token ficam isolados por empresa. O token nunca é exibido depois de salvo.</p>
                </div>
              )}

              {selectedTenantId && moduleStatus && (
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-sm font-black text-indigo-900 dark:text-indigo-200">Módulo de notificações</h3><p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-1">Escolha entre o telefone oficial SaaS, sem mensalidade adicional, ou o número próprio da empresa.</p></div>
                    <span className="rounded-full bg-white/80 dark:bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">{moduleStatus.plan === 'SAAS_FREE' ? 'SaaS grátis' : moduleStatus.billingStatus}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className={`rounded-lg border p-3 ${moduleStatus.plan === 'SAAS_FREE' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 bg-white/70 dark:bg-slate-900/40'}`}>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{moduleStatus.config.freePlanName}</p><p className="mt-1 text-[11px] text-slate-500">{moduleStatus.config.freePlanDescription}</p>
                      <button type="button" onClick={() => void handleSelectFreeModule()} disabled={moduleBusy || moduleStatus.plan === 'SAAS_FREE'} className="mt-3 rounded-lg border border-emerald-300 px-3 py-2 text-[11px] font-bold text-emerald-700 disabled:opacity-50">{moduleStatus.plan === 'SAAS_FREE' ? 'Plano atual' : 'Usar telefone SaaS'}</button>
                    </div>
                    <div className={`rounded-lg border p-3 ${moduleStatus.plan === 'OWN_NUMBER' ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 bg-white/70 dark:bg-slate-900/40'}`}>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{moduleStatus.config.ownNumberPlanName}</p><p className="mt-1 text-[11px] text-slate-500">R$ {Number(moduleStatus.config.ownNumberMonthlyPrice).toFixed(2).replace('.', ',')}/mês · {moduleStatus.config.ownNumberPlanDescription}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void handleSubscribeOwnNumber()} disabled={moduleBusy || moduleStatus.plan === 'OWN_NUMBER'} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{moduleStatus.plan === 'OWN_NUMBER' ? (moduleStatus.canUseOwnNumber ? 'Número próprio ativo' : 'Aguardando pagamento') : 'Contratar número próprio'}</button>{moduleStatus.plan === 'OWN_NUMBER' && <button type="button" onClick={() => void handleCancelOwnNumber()} disabled={moduleBusy} className="rounded-lg border border-rose-300 px-3 py-2 text-[11px] font-bold text-rose-700 dark:text-rose-300 disabled:opacity-50">Cancelar módulo</button>}</div>
                    </div>
                  </div>
                  {moduleMessage && <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">{moduleMessage}</p>}
                  {moduleStatus.plan === 'OWN_NUMBER' && !moduleStatus.canUseOwnNumber && <p className="text-[10px] text-amber-700 dark:text-amber-300">A configuração do canal próprio será liberada somente após o Asaas confirmar o pagamento. Nenhum segredo é enviado ao navegador.</p>}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Sliders className="w-4 h-4 text-emerald-600" /> Parâmetros do Atendo CRM</h3>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">{scopeLabel}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">URL base HTTPS:</label>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"><Globe className="w-4 h-4 text-slate-400 shrink-0" /><input type="url" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://seu-gateway-whatsapp" className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden font-mono" /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Token Bearer:</label>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"><Lock className="w-4 h-4 text-slate-400 shrink-0" /><input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder={tokenSaved ? 'Token salvo; deixe vazio para manter' : 'Cole o token Bearer do Atendo CRM'} autoComplete="new-password" className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden font-mono" /></div>
                    <p className="text-[11px] text-slate-500 mt-1">{tokenSaved ? 'Token salvo no cofre criptografado desta empresa. O campo fica vazio por segurança; não é necessário digitá-lo novamente.' : 'O token será salvo somente no cofre criptografado do servidor. Ele não retorna ao navegador nem fica no estado JSONB.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Número para conexão (opcional):</label>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" /><input type="text" value={defaultChannelNumber} onChange={e => setDefaultChannelNumber(e.target.value)} placeholder="5517999999999" className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden font-mono" /></div>
                      <p className="text-[10px] text-slate-500 mt-1">Deixe vazio para QR Code. Com o número preenchido, o Atendo CRM pode retornar o código de pareamento.</p>
                    </div>
                    <div className="space-y-2 pt-2 sm:pt-0">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" /> Integração ativa</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={autoNotifyChecklist} onChange={e => setAutoNotifyChecklist(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" /> Avisar ao salvar checklist</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={autoNotifyFreightStatus} onChange={e => setAutoNotifyFreightStatus(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" /> Avisar mudanças de frete</label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  {saveSuccessMsg ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{saveSuccessMsg}</span> : <span />}
                  <button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-colors">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}<span>Salvar configuração</span></button>
                </div>
              </form>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">{connectionStatus === 'CONNECTED' ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-slate-500" />} Estado do canal: <span className="text-emerald-700 dark:text-emerald-400">{statusLabel[connectionStatus] || connectionStatus}</span></h3>
                  <button type="button" onClick={handleGetStatus} disabled={checkingStatus} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5">{checkingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Atualizar status</button>
                </div>
                {connectionMessage && <p className="text-xs text-slate-600 dark:text-slate-300">{connectionMessage}</p>}
                  <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleRequestQr(false)} disabled={requestingQr || !isActive || !canRequestConnectionCode} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"><QrCode className="w-4 h-4" />{requestingQr ? 'Aguardando canal...' : 'Gerar QR Code'}</button>
                  <button type="button" onClick={() => handleRequestQr(true)} disabled={requestingQr || !isActive || !canRequestConnectionCode || !defaultChannelNumber.trim()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"><Phone className="w-4 h-4" />Gerar código de pareamento</button>
                  <span className="text-[11px] text-slate-500 self-center">QR e código são temporários e não são salvos no banco.</span>
                </div>
                {!canRequestConnectionCode && <p className="text-xs text-amber-700 dark:text-amber-300">Selecione uma empresa para conectar o canal dela. A configuração global permanece apenas como fallback.</p>}
                {pairingCode && (
                  <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500">Digite este código no WhatsApp do telefone informado:</p>
                    <code className="px-5 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-2xl tracking-[0.3em] font-black text-indigo-700 dark:text-indigo-300">{pairingCode}</code>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">O código é temporário e não é persistido pelo Gestor.</p>
                  </div>
                )}
                {qrCode && (
                  <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <img src={qrImage} alt="QR Code temporário de conexão WhatsApp" className="w-64 h-64 object-contain bg-white p-2 rounded-xl border border-slate-200" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">{qrExpiresAt && qrExpiresAt > Date.now() ? `Expira em aproximadamente ${Math.ceil((qrExpiresAt - Date.now()) / 1000)} segundos.` : 'QR Code expirado; gere outro para tentar novamente.'}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 border border-slate-800 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2"><div className="flex items-center gap-2"><Radio className="w-4 h-4 text-amber-400" /><h3 className="font-bold text-slate-100">Teste de envio real</h3></div><span className="text-[10px] text-amber-300">Exige destinatário autorizado</span></div>
                <p className="text-[11px] text-slate-400">Este botão envia uma mensagem ao número informado. Não use até confirmar o número e autorizar o teste.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="block text-slate-400 font-semibold mb-1">Número de destino:</label><input type="text" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="5517999999999" className="w-full bg-slate-800 border border-slate-700 text-white px-2.5 py-1.5 rounded focus:outline-hidden font-mono" /></div>
                  <div className="sm:col-span-2"><label className="block text-slate-400 font-semibold mb-1">Mensagem:</label><div className="flex items-center gap-2"><input type="text" value={testMessage} onChange={e => setTestMessage(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white px-2.5 py-1.5 rounded focus:outline-hidden truncate" /><button type="button" onClick={handleTestConnection} disabled={testing} className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded shrink-0 cursor-pointer flex items-center gap-1">{testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}<span>{testing ? 'Enviando...' : 'Testar envio'}</span></button></div></div>
                </div>
                {testResult && <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' : 'bg-rose-950/80 border-rose-700 text-rose-200'} space-y-1.5`}><div className="flex items-center gap-1.5 font-bold">{testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{testResult.success ? 'Envio realizado' : 'Falha na transmissão'}</div><p className="text-xs">{testResult.message}</p>{testResult.details && <pre className="text-[10px] bg-slate-950/90 p-2 rounded overflow-x-auto text-slate-300 font-mono">{JSON.stringify(testResult.details, null, 2)}</pre>}</div>}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5"><div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-emerald-600" /> Contrato Atendo CRM utilizado</div><p><strong>Texto:</strong> <code>{`{ body: "...", number: "55...", externalKey: "..." }`}</code><br /><strong>QR/status:</strong> <code>POST /qrcode</code> e <code>GET /statuschannel</code><br /><strong>Token:</strong> somente no header Bearer no backend.</p></div>
            </>
          )}
        </div>
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end"><button type="button" onClick={handleClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer">Fechar</button></div>
      </div>
    </div>
  );
};
