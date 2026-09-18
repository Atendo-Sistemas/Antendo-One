import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Database, Loader2, Play, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import type { BackupStatusResponse } from '../../types';

type PanelMessage = { type: 'success' | 'error'; text: string } | null;

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Ainda não registrado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString('pt-BR');
};

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value < 1024) return `${Math.max(0, Math.round(value || 0))} B`;
  const units = ['KB', 'MB', 'GB'];
  let amount = value / 1024;
  let unit = units[0];
  for (let index = 0; amount >= 1024 && index < units.length - 1; index += 1) {
    amount /= 1024;
    unit = units[index + 1];
  }
  return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${unit}`;
};

const statusCopy: Record<BackupStatusResponse['state'], { label: string; className: string }> = {
  SUCCESS: { label: 'Backup saudável', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ERROR: { label: 'Falha no último ciclo', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  RUNNING: { label: 'Backup em andamento', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  UNKNOWN: { label: 'Status indisponível', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  UNAVAILABLE: { label: 'Monitor não conectado', className: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export const BackupMonitorPanel: React.FC = () => {
  const [status, setStatus] = useState<BackupStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [message, setMessage] = useState<PanelMessage>(null);

  const loadStatus = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      setStatus(await api.getBackupStatus());
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível consultar o monitor de backup.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const state = status?.state || 'UNKNOWN';
  const statePresentation = statusCopy[state];
  const manualDisabled = !status?.configured || running || state === 'RUNNING' || status.manualRequestPending;
  const notificationSummary = useMemo(() => {
    if (!status) return 'Carregando preferências';
    if (!status.notifications.whatsappEnabled || !status.notifications.whatsappPhoneMasked) return 'WhatsApp de alerta desativado';
    return `WhatsApp ${status.notifications.whatsappPhoneMasked}`;
  }, [status]);

  const runManualBackup = async () => {
    if (manualDisabled) return;
    if (!window.confirm('Solicitar um backup manual agora? O processo será executado pelo serviço seguro da VPS.')) return;
    setRunning(true);
    setMessage(null);
    try {
      const result = await api.requestManualBackup();
      setMessage({ type: 'success', text: result.message || 'Backup manual enfileirado.' });
      await loadStatus(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível solicitar o backup manual.' });
    } finally {
      setRunning(false);
    }
  };

  const saveNotifications = async () => {
    if (!status) return;
    setSavingNotifications(true);
    setMessage(null);
    try {
      await api.updateBackupNotifications({
        enabled: status.notifications.enabled,
        whatsappEnabled: status.notifications.whatsappEnabled,
        whatsappPhone: phoneDraft.trim() || '********',
        notifyOnFailure: status.notifications.notifyOnFailure,
        notifyOnSuccess: status.notifications.notifyOnSuccess
      });
      setPhoneDraft('');
      setMessage({ type: 'success', text: 'Preferências de alerta de backup salvas.' });
      await loadStatus(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível salvar as preferências de alerta.' });
    } finally {
      setSavingNotifications(false);
    }
  };

  const testWhatsApp = async () => {
    setTestingWhatsApp(true);
    setMessage(null);
    try {
      const result = await api.testBackupWhatsApp();
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível enviar o teste WhatsApp.' });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-12 text-sm font-semibold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Carregando monitor de backups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white"><Database className="h-5 w-5 text-emerald-600" /> Monitor de backups</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Acompanhe o cron local da VPS, a retenção de três cópias e os alertas operacionais. O painel não exibe caminhos, dumps ou credenciais.</p>
        </div>
        <button type="button" onClick={() => void loadStatus(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar</button>
      </div>

      {message && <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{message.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}<span>{message.text}</span></div>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={`rounded-xl border p-4 ${statePresentation.className}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider">Estado</span>{state === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5" /> : state === 'ERROR' ? <AlertTriangle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</div><strong className="mt-2 block text-sm">{statePresentation.label}</strong><span className="mt-1 block text-[10px]">{status?.configured ? `Retenção: ${status.retention} cópias` : 'Verifique a montagem do controle na aplicação'}</span></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Último sucesso</span><strong className="mt-2 block text-sm text-slate-800 dark:text-white">{formatDate(status?.lastSuccessAt)}</strong><span className="mt-1 block text-[10px] text-slate-500">{status?.schedule || 'Agenda não informada'}</span></div>
        <div className={`rounded-xl border p-4 ${status?.lastErrorAt ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200'}`}><span className="text-[10px] font-black uppercase tracking-wider">Última falha</span><strong className="mt-2 block text-sm">{formatDate(status?.lastErrorAt)}</strong><span className="mt-1 block text-[10px]">{status?.lastErrorMessage || 'Nenhuma falha registrada no status atual.'}</span></div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="text-sm font-black text-slate-800 dark:text-white">Três últimos backups</h4><p className="mt-1 text-[11px] text-slate-500">A verificação SHA-256 é realizada pelo serviço antes de cada cópia ser considerada concluída.</p></div><button type="button" onClick={() => void runManualBackup()} disabled={manualDisabled} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4" />{running || status?.manualRequestPending ? 'Backup solicitado...' : 'Fazer backup agora'}</button></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {status?.backups?.length ? status.backups.map(item => <div key={item.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong className="font-mono text-xs text-slate-800 dark:text-slate-100">{item.name}</strong>{item.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><ShieldCheck className="h-3 w-3" /> íntegro</span> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">verificar</span>}</div><span className="mt-1 block text-[11px] text-slate-500">Gerado em {formatDate(item.generatedAt)}</span></div><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatBytes(item.sizeBytes)}</span></div>) : <div className="p-6 text-center text-xs text-slate-500">Nenhuma cópia foi publicada no monitor ainda.</div>}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h4 className="flex items-center gap-2 text-sm font-black text-indigo-900 dark:text-indigo-200"><Send className="h-4 w-4" /> Alertas por WhatsApp</h4><p className="mt-1 text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">{notificationSummary}. Falhas ficam ativadas por padrão; sucessos são opcionais. O número é armazenado como configuração do SaaS e aparece mascarado.</p></div><button type="button" onClick={testWhatsApp} disabled={testingWhatsApp || !status?.notifications.whatsappEnabled || !status.notifications.whatsappPhoneMasked} className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-800 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200"><Send className="h-4 w-4" />{testingWhatsApp ? 'Enviando...' : 'Enviar teste'}</button></div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"><label className="text-xs font-bold text-slate-700 dark:text-slate-200">Número de WhatsApp do responsável<input value={phoneDraft} onChange={event => setPhoneDraft(event.target.value)} placeholder={status?.notifications.whatsappPhoneMasked || '(DDI + DDD + número)'} inputMode="tel" className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500 dark:border-indigo-800 dark:bg-slate-900" /><span className="mt-1 block text-[10px] font-normal text-slate-500">Digite um novo número para alterar. Deixe vazio para manter o cadastrado.</span></label><div className="space-y-2 text-xs text-slate-700 dark:text-slate-200"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={status?.notifications.whatsappEnabled || false} onChange={event => status && setStatus({ ...status, notifications: { ...status.notifications, whatsappEnabled: event.target.checked } })} /> Ativar alertas WhatsApp</label><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={status?.notifications.notifyOnFailure || false} onChange={event => status && setStatus({ ...status, notifications: { ...status.notifications, notifyOnFailure: event.target.checked } })} /> Avisar quando houver falha</label><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={status?.notifications.notifyOnSuccess || false} onChange={event => status && setStatus({ ...status, notifications: { ...status.notifications, notifyOnSuccess: event.target.checked } })} /> Avisar quando concluir com sucesso</label><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={status?.notifications.enabled || false} onChange={event => status && setStatus({ ...status, notifications: { ...status.notifications, enabled: event.target.checked } })} /> Ativar o módulo de alertas</label></div></div>
        <div className="mt-4 flex justify-end border-t border-indigo-200 pt-3 dark:border-indigo-900/60"><button type="button" onClick={saveNotifications} disabled={savingNotifications || !status} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">{savingNotifications ? 'Salvando...' : 'Salvar alertas de backup'}</button></div>
      </div>
    </div>
  );
};
