import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Mail, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const NotificationConsentPanel: React.FC = () => {
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getNotificationConsent()
      .then(result => {
        if (cancelled) return;
        setEmail(result.email !== false);
        setWhatsapp(result.whatsapp === true);
      })
      .catch(error => { if (!cancelled) setMessage(error?.message || 'Não foi possível carregar suas preferências.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.updateNotificationConsent({ email, whatsapp });
      setMessage('Preferências salvas. O WhatsApp só será usado nos eventos autorizados e enquanto esta opção permanecer ativa.');
    } catch (error: any) {
      setMessage(error?.message || 'Não foi possível salvar suas preferências.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw className="w-5 h-5 animate-spin" /> Carregando preferências...</div>;

  return (
    <section className="max-w-3xl mx-auto space-y-5" aria-labelledby="notification-consent-title">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 p-6 text-white shadow-lg">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-white/15 p-2"><Bell className="w-6 h-6" /></div><div><h1 id="notification-consent-title" className="text-xl font-black">Preferências de notificações</h1><p className="mt-1 text-sm text-indigo-100">Escolha como deseja receber comunicações operacionais da plataforma.</p></div></div>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 w-5 h-5 text-emerald-600 shrink-0" /><p className="text-sm text-slate-600 dark:text-slate-300">Códigos de acesso, confirmações de segurança e avisos indispensáveis à conta podem continuar sendo enviados como mensagens transacionais. Esta tela controla comunicações operacionais e não armazena token de canal.</p></div>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer"><input type="checkbox" checked={email} onChange={event => setEmail(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-600" /><span><span className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100"><Mail className="w-4 h-4 text-emerald-600" /> E-mail</span><span className="block mt-1 text-xs text-slate-500">Receber avisos de cadastro, fretes, aprovação, cobrança e mudanças de status no e-mail cadastrado.</span></span></label>
        <label className="flex items-start gap-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 cursor-pointer"><input type="checkbox" checked={whatsapp} onChange={event => setWhatsapp(event.target.checked)} className="mt-1 h-4 w-4 accent-indigo-600" /><span><span className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100"><MessageCircle className="w-4 h-4 text-indigo-600" /> WhatsApp — consentimento explícito</span><span className="block mt-1 text-xs text-slate-600 dark:text-slate-400">Autorizar o envio de notificações operacionais para o telefone desta conta. A autorização não libera envio para terceiros nem altera o canal configurado pela empresa.</span></span></label>
        <div className="flex items-center justify-between gap-3 pt-2"><span className="text-[11px] text-slate-500">Você pode alterar esta decisão a qualquer momento.</span><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Salvar preferências</button></div>
        {message && <p role="status" className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">{message}</p>}
      </div>
    </section>
  );
};
