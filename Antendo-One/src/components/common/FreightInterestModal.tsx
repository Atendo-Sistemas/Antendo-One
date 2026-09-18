import React, { useState } from 'react';
import { CheckCircle2, LockKeyhole, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { api, setAuthToken } from '../../services/api';
import { PublicFreightSummary } from '../../types';

interface FreightInterestModalProps {
  freight: PublicFreightSummary;
  onClose: () => void;
  onCompleted: () => void;
}
const inputClass = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

export const FreightInterestModal: React.FC<FreightInterestModalProps> = ({ freight, onClose, onCompleted }) => {
  const [step, setStep] = useState<'basic' | 'otp' | 'profile' | 'done'>('basic');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [releasedPrice, setReleasedPrice] = useState<number | null>(null);
  const [profile, setProfile] = useState({ email: '', cpf: '', cnh: '', cnhCategory: 'E', cnhExpiresAt: '', city: '', state: 'SP', vehicleType: 'TRUCK', vehicleBrand: '', vehicleModel: '', vehicleYear: String(new Date().getFullYear()), vehiclePlate: '', capacityKg: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setProfileField = (field: keyof typeof profile, value: string) => setProfile(prev => ({ ...prev, [field]: value }));
  const requestInterest = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError(null);
      const response = await api.startFreightInterest({ freightId: freight.id, name, phone, termsAccepted, privacyAccepted });
      setUserId(response.userId);
      setStep('otp');
    } catch (err: any) { setError(err.message || 'Não foi possível iniciar o cadastro.'); } finally { setLoading(false); }
  };
  const verifyPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError(null);
      const response = await api.verifyOtp(phone, code);
      setAuthToken(response.token);
      setUserId(response.user.id);
      setStep('profile');
    } catch (err: any) { setError(err.message || 'Código inválido ou expirado.'); } finally { setLoading(false); }
  };
  const completeProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError(null);
      await api.completeQuickDriver(userId, { ...profile, name, phone, freightId: freight.id });
      try { const details = await api.getPublicFreightDetails(freight.id); setReleasedPrice(details.priceAvailable ? details.price : null); } catch { setReleasedPrice(null); }
      setStep('done');
    } catch (err: any) { setError(err.message || 'Não foi possível concluir o cadastro.'); } finally { setLoading(false); }
  };
  const title = step === 'basic' ? 'Demonstrar interesse no frete' : step === 'otp' ? 'Validar telefone por WhatsApp' : step === 'profile' ? 'Concluir cadastro de motorista' : 'Solicitação enviada';
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 p-5"><div><p className="text-[10px] uppercase tracking-wider font-black text-emerald-600">{freight.code}</p><h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2><p className="text-xs text-slate-500 mt-1">{freight.originCity}/{freight.originState} → {freight.destinationCity}/{freight.destinationState} • {freight.vehicleType}</p></div><button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Fechar"><X className="w-5 h-5" /></button></div>
      <div className="p-5 space-y-4">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-300">{error}</div>}
        {step === 'basic' && <form onSubmit={requestInterest} className="space-y-4"><div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-900 dark:text-amber-200 flex gap-2"><LockKeyhole className="w-4 h-4 shrink-0" /><span>O valor do frete é liberado somente após cadastro e validação. Seus dados serão enviados à empresa que publicou esta oportunidade para análise do interesse.</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs font-semibold">Nome completo *<input required value={name} onChange={e => setName(e.target.value)} className={inputClass} autoComplete="name" /></label><label className="text-xs font-semibold">Telefone/WhatsApp *<input required value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} autoComplete="tel" placeholder="(17) 98888-7777" /></label></div><label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" required checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-0.5" /><span>Concordo com os <a className="text-emerald-600 font-bold hover:underline" href="/conteudo/termos-de-uso" target="_blank" rel="noreferrer">Termos de Uso</a>.</span></label><label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" required checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="mt-0.5" /><span>Concordo com a <a className="text-emerald-600 font-bold hover:underline" href="/conteudo/politica-de-privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>.</span></label><button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{loading ? 'Enviando código...' : 'Continuar pelo WhatsApp'}</button></form>}
        {step === 'otp' && <form onSubmit={verifyPhone} className="space-y-4"><div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-4 text-xs text-emerald-900 dark:text-emerald-200 flex gap-2"><MessageCircle className="w-4 h-4 shrink-0" /><span>Enviamos um código de 6 dígitos para o WhatsApp informado. O código é válido por 5 minutos.</span></div><label className="text-xs font-semibold block text-center">Código de validação<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className={`${inputClass} mt-1 text-center text-lg tracking-[0.35em]`} /></label><button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{loading ? 'Validando...' : 'Validar telefone'}</button></form>}
        {step === 'profile' && <form onSubmit={completeProfile} className="space-y-4"><div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-3 text-xs text-blue-900 dark:text-blue-200">Complete os dados abaixo. A empresa analisará o cadastro antes de liberar o frete para você.</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"><label className="text-xs font-semibold">E-mail *<input required type="email" value={profile.email} onChange={e => setProfileField('email', e.target.value)} className={inputClass} autoComplete="email" /></label><label className="text-xs font-semibold">CPF *<input required value={profile.cpf} onChange={e => setProfileField('cpf', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">CNH *<input required value={profile.cnh} onChange={e => setProfileField('cnh', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">Categoria CNH *<select value={profile.cnhCategory} onChange={e => setProfileField('cnhCategory', e.target.value)} className={inputClass}><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option></select></label><label className="text-xs font-semibold">Validade CNH *<input required type="date" value={profile.cnhExpiresAt} onChange={e => setProfileField('cnhExpiresAt', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">Cidade *<input required value={profile.city} onChange={e => setProfileField('city', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">UF *<input required maxLength={2} value={profile.state} onChange={e => setProfileField('state', e.target.value.toUpperCase())} className={inputClass} /></label><label className="text-xs font-semibold">Tipo de veículo *<select value={profile.vehicleType} onChange={e => setProfileField('vehicleType', e.target.value)} className={inputClass}><option value="TRUCK">Truck</option><option value="TOCO">Toco</option><option value="CARRETA">Carreta</option><option value="BITREM">Bitrem</option><option value="RODOTREM">Rodotrem</option><option value="VUC">VUC</option><option value="VAN">Van</option></select></label><label className="text-xs font-semibold">Marca *<input required value={profile.vehicleBrand} onChange={e => setProfileField('vehicleBrand', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">Modelo *<input required value={profile.vehicleModel} onChange={e => setProfileField('vehicleModel', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">Ano *<input required type="number" value={profile.vehicleYear} onChange={e => setProfileField('vehicleYear', e.target.value)} className={inputClass} /></label><label className="text-xs font-semibold">Placa *<input required value={profile.vehiclePlate} onChange={e => setProfileField('vehiclePlate', e.target.value.toUpperCase())} className={inputClass} /></label><label className="text-xs font-semibold">Capacidade kg *<input required type="number" min="1" value={profile.capacityKg} onChange={e => setProfileField('capacityKg', e.target.value)} className={inputClass} /></label></div><button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{loading ? 'Enviando para análise...' : 'Concluir cadastro e enviar para aprovação'}</button></form>}
        {step === 'done' && <div className="text-center py-6 space-y-4"><CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" /><h3 className="text-lg font-black text-slate-900 dark:text-white">Cadastro enviado para análise</h3><p className="text-sm text-slate-500">A empresa responsável pelo frete analisará suas informações. O vínculo aprovado será específico para essa empresa e não impede novos cadastros em outras empresas da plataforma.</p>{releasedPrice !== null && <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 text-emerald-800 dark:text-emerald-200"><span className="text-xs font-bold block">Valor informado pela empresa</span><strong className="text-2xl">R$ {releasedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>}<button onClick={onClose} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white cursor-pointer">Fechar</button></div>}
        <div className="flex items-center gap-2 text-[10px] text-slate-400"><ShieldCheck className="w-3.5 h-3.5" />A aprovação é feita pela empresa que publicou o frete e não é uma certificação global da plataforma.</div>
      </div>
    </div>
  </div>;
};
