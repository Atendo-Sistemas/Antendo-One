import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { api, setAuthSession } from '../../services/api';

type Registration = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiresAt: string;
  city: string;
  state: string;
};
const initialRegistration: Registration = { name: '', email: '', phone: '', cpf: '', cnh: '', cnhCategory: 'E', cnhExpiresAt: '', city: '', state: '' };
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export const PublicDriverRegistrationModal: React.FC<{ onClose: () => void; standalone?: boolean }> = ({ onClose, standalone = false }) => {
  const [registration, setRegistration] = useState(initialRegistration);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [directoryConsent, setDirectoryConsent] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'profile' | 'verify' | 'done'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setField = (field: keyof Registration, value: string) => setRegistration(previous => ({ ...previous, [field]: value }));

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      await api.registerPublicDriver({ ...registration, state: registration.state.toUpperCase(), termsAccepted, privacyAccepted, directoryConsent });
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Não foi possível iniciar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      const response = await api.verifyOtp(registration.phone, code);
      setAuthSession(response.token, response.refreshToken);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return <div className={standalone ? 'flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950 sm:p-8' : 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4'} role="dialog" aria-modal={standalone ? undefined : true} aria-labelledby="driver-registration-title">
    <div className={`${standalone ? '' : 'max-h-[92vh]'} w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cadastro independente de fretes</p><h2 id="driver-registration-title" className="mt-1 text-xl font-black text-slate-900 dark:text-white">{step === 'verify' ? 'Validar telefone' : step === 'done' ? 'Cadastro concluído' : 'Cadastrar perfil de motorista'}</h2><p className="mt-1 text-xs text-slate-500">Cadastre-se mesmo quando não houver fretes publicados.</p></div>{step !== 'done' && <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar"><X className="h-5 w-5" /></button>}</div>
      <div className="space-y-4 p-5">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
        {step === 'profile' && <form onSubmit={submitProfile} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold sm:col-span-2">Nome completo *<input required minLength={5} value={registration.name} onChange={event => setField('name', event.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">E-mail *<input required type="email" value={registration.email} onChange={event => setField('email', event.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Telefone / WhatsApp *<input required value={registration.phone} onChange={event => setField('phone', event.target.value)} placeholder="(11) 99999-9999" className={inputClass} /></label>
            <label className="text-xs font-semibold">CPF *<input required value={registration.cpf} onChange={event => setField('cpf', event.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">CNH *<input required value={registration.cnh} onChange={event => setField('cnh', event.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Categoria CNH *<select value={registration.cnhCategory} onChange={event => setField('cnhCategory', event.target.value)} className={inputClass}><option>B</option><option>C</option><option>D</option><option>E</option></select></label>
            <label className="text-xs font-semibold">Validade da CNH *<input required type="date" value={registration.cnhExpiresAt} onChange={event => setField('cnhExpiresAt', event.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">Cidade *<input required value={registration.city} onChange={event => setField('city', event.target.value)} className={inputClass} /></label>
            <label className="text-xs font-semibold">UF *<input required maxLength={2} value={registration.state} onChange={event => setField('state', event.target.value.toUpperCase())} className={inputClass} /></label>
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" required checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} className="mt-0.5" /><span>Aceito os <a className="font-bold text-emerald-600 hover:underline" href="/conteudo/termos-de-uso" target="_blank" rel="noreferrer">Termos de Uso</a>.</span></label>
          <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" required checked={privacyAccepted} onChange={event => setPrivacyAccepted(event.target.checked)} className="mt-0.5" /><span>Li e aceito a <a className="font-bold text-emerald-600 hover:underline" href="/conteudo/politica-de-privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>.</span></label>
          <label className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200"><input type="checkbox" checked={directoryConsent} onChange={event => setDirectoryConsent(event.target.checked)} className="mt-0.5" /><span>Autorizo que empresas cadastradas consultem meu nome, cidade, UF e categoria da CNH. Se uma empresa solicitar minha avaliação, autorizo o compartilhamento do telefone, CPF e dados da CNH com essa empresa para análise.</span></label>
          <button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Enviando código...' : 'Continuar pelo WhatsApp'}</button>
        </form>}
        {step === 'verify' && <form onSubmit={verifyPhone} className="space-y-4"><div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200"><MessageCircle className="h-4 w-4 shrink-0" />Enviamos um código de seis dígitos para o telefone informado. O perfil só será ativado depois da confirmação.</div><label className="block text-center text-xs font-semibold">Código de validação<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} className={`${inputClass} mt-1 text-center text-lg tracking-[0.35em]`} /></label><button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading ? 'Validando...' : 'Validar e concluir cadastro'}</button></form>}
        {step === 'done' && <div className="space-y-4 py-4 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><p className="text-sm text-slate-600 dark:text-slate-300">Seu perfil foi criado. A avaliação de aptidão é feita separadamente por cada empresa.</p>{directoryConsent && <p className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"><ShieldCheck className="h-4 w-4" />Seu perfil básico está disponível no catálogo de empresas.</p>}<button onClick={() => { window.location.href = '/'; }} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white">Acessar minha conta</button></div>}
      </div>
    </div>
  </div>;
};
