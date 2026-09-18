import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export const CompanyEmailConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<any>({ host: '', port: 587, user: '', password: '', senderEmail: '', testEmail: '', isActive: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { api.getTenantEmailConfig().then(setConfig).catch((error: any) => setMessage(error.message || 'Não foi possível carregar o SMTP.')).finally(() => setLoading(false)); }, []);
  const update = (field: string, value: any) => setConfig((current: any) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try { const result = await api.updateTenantEmailConfig(config); setConfig(result.config); setMessage('Configuração SMTP da empresa salva com sucesso.'); }
    catch (error: any) { setMessage(error.message || 'Não foi possível salvar a configuração SMTP.'); }
    finally { setSaving(false); }
  };
  if (loading) return <div className="p-6 text-sm text-slate-500">Carregando configuração de e-mail...</div>;
  return <section className="max-w-3xl mx-auto p-6 space-y-5">
    <div><h1 className="text-2xl font-black text-slate-900 dark:text-white">SMTP da empresa</h1><p className="text-sm text-slate-500 mt-1">Configure o servidor usado para enviar as notificações desta empresa. Se não houver SMTP próprio, o sistema utiliza o SMTP SaaS quando disponível.</p></div>
    <form onSubmit={save} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><label className="md:col-span-2 text-sm font-semibold">Servidor SMTP<input required value={config.host || ''} onChange={e => update('host', e.target.value)} className="mt-1 w-full rounded-lg border p-2" placeholder="smtp.suaempresa.com.br" /></label><label className="text-sm font-semibold">Porta<input required type="number" value={config.port || 587} onChange={e => update('port', Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-sm font-semibold">Usuário<input required value={config.user || ''} onChange={e => update('user', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-sm font-semibold">Senha<input required={!config.password} type="password" value={config.password || ''} onChange={e => update('password', e.target.value)} className="mt-1 w-full rounded-lg border p-2" placeholder={config.password === '********' ? 'Senha mantida' : ''} /></label></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-sm font-semibold">E-mail remetente<input type="email" value={config.senderEmail || ''} onChange={e => update('senderEmail', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-sm font-semibold">E-mail para teste<input type="email" value={config.testEmail || ''} onChange={e => update('testEmail', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label></div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={config.isActive !== false} onChange={e => update('isActive', e.target.checked)} /> Ativar envio por SMTP próprio</label>
      {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
      <button disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar SMTP da empresa'}</button>
    </form>
  </section>;
};
