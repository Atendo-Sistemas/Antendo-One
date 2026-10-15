import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Mail, MapPin, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { api, userFacingError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { registerPushNotifications } from '../../services/pushClient';

const isTenantAdmin = (role?: string) => role === 'EMPRESA_SUPER_ADMIN' || role === 'ADMIN' || role === 'SUPER_ADMIN';

const readCurrentPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Este dispositivo não disponibiliza localização GPS.'));
  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
});

interface NotificationConsentPanelProps {
  mode?: 'preferences' | 'freight-alerts';
}

export const NotificationConsentPanel: React.FC<NotificationConsentPanelProps> = ({ mode = 'preferences' }) => {
  const { user, driver, refreshProfile } = useAuth();
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [geoConfig, setGeoConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGeo, setSavingGeo] = useState(false);
  const [message, setMessage] = useState('');

  const showPreferences = mode === 'preferences';
  const showFreightAlerts = mode === 'freight-alerts';
  const canConfigureCompany = showFreightAlerts && isTenantAdmin(user?.role) && user?.role !== 'SUPER_ADMIN' && user?.accountType !== 'TEST' && Boolean(user?.tenantId);
  const isDriver = showPreferences && user?.role === 'MOTORISTA' && Boolean(driver);

  useEffect(() => {
    let cancelled = false;
    const requests: Promise<any>[] = [];
    if (showPreferences) requests.push(api.getNotificationConsent());
    if (isDriver) requests.push(api.getDriverProximitySettings());
    if (canConfigureCompany) requests.push(api.getFreightAlertConfig());
    Promise.all(requests)
      .then(results => {
        if (cancelled) return;
        let index = 0;
        if (showPreferences) {
          const consent = results[index++];
          setEmail(consent?.email !== false);
          setWhatsapp(consent?.whatsapp === true);
        }
        if (isDriver && results[index]) {
          setProximityEnabled(results[index].enabled === true);
          index += 1;
        }
        if (canConfigureCompany && results[index]) setGeoConfig(results[index]);
      })
      .catch(error => { if (!cancelled) setMessage(userFacingError(error, showFreightAlerts ? 'Não foi possível carregar os alertas de frete.' : 'Não foi possível carregar suas preferências.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [showPreferences, showFreightAlerts, isDriver, canConfigureCompany]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.updateNotificationConsent({ email, whatsapp });
      setMessage('Preferências salvas. O WhatsApp só será usado nos eventos autorizados e enquanto esta opção permanecer ativa.');
    } catch (error: any) {
      setMessage(userFacingError(error, 'Não foi possível salvar suas preferências.'));
    } finally { setSaving(false); }
  };

  const saveDriverProximity = async (enabled: boolean) => {
    setSavingGeo(true);
    setMessage('');
    try {
      if (!enabled) {
        await api.updateDriverProximitySettings(false);
        setProximityEnabled(false);
        await refreshProfile();
        setMessage('Compartilhamento de localização desativado.');
        return;
      }
      const push = await registerPushNotifications();
      if (!push.success) throw new Error(`Ative as notificações Push antes de ativar a proximidade: ${push.message}`);
      const position = await readCurrentPosition();
      await api.updateDriverProximitySettings(true);
      await api.updateDriverLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        recordedAt: new Date(position.timestamp).toISOString()
      });
      setProximityEnabled(true);
      await refreshProfile();
      setMessage('Proximidade ativada. O sistema usará sua localização apenas para filtrar alertas de fretes da sua empresa.');
    } catch (error: any) {
      if (enabled) {
        try { await api.updateDriverProximitySettings(false); } catch { /* mantém a preferência desativada se o GPS for recusado */ }
        setProximityEnabled(false);
      }
      setMessage(error?.code === 1 ? 'A permissão de localização foi recusada. Ative-a nas permissões do navegador para usar alertas por proximidade.' : userFacingError(error, 'Não foi possível atualizar o compartilhamento de localização.'));
    } finally { setSavingGeo(false); }
  };

  const saveGeoConfig = async () => {
    if (!geoConfig) return;
    setSavingGeo(true);
    setMessage('');
    try {
      const saved = await api.updateFreightAlertConfig(geoConfig);
      setGeoConfig(saved);
      setMessage('Política de alertas geográficos salva para esta empresa.');
    } catch (error: any) {
      setMessage(userFacingError(error, 'Não foi possível salvar a política geográfica.'));
    } finally { setSavingGeo(false); }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw className="w-5 h-5 animate-spin" /> Carregando preferências...</div>;

  return (
    <section className="max-w-3xl mx-auto space-y-5" aria-labelledby="notification-consent-title">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 p-6 text-white shadow-lg">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-white/15 p-2">{showFreightAlerts ? <MapPin className="w-6 h-6" /> : <Bell className="w-6 h-6" />}</div><div><h1 id="notification-consent-title" className="text-xl font-black">{showFreightAlerts ? 'Alertas de frete' : 'Preferências de notificações'}</h1><p className="mt-1 text-sm text-indigo-100">{showFreightAlerts ? 'Configure o raio usado para direcionar alertas aos motoristas desta empresa.' : 'Escolha como deseja receber comunicações operacionais da plataforma.'}</p></div></div>
      </div>
      {showPreferences && <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 w-5 h-5 text-emerald-600 shrink-0" /><p className="text-sm text-slate-600 dark:text-slate-300">Códigos de acesso, confirmações de segurança e avisos indispensáveis à conta podem continuar sendo enviados como mensagens transacionais. Esta tela controla comunicações operacionais e não armazena token de canal.</p></div>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer"><input type="checkbox" checked={email} onChange={event => setEmail(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-600" /><span><span className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100"><Mail className="w-4 h-4 text-emerald-600" /> E-mail</span><span className="block mt-1 text-xs text-slate-500">Receber avisos de cadastro, fretes, aprovação, cobrança e mudanças de status no e-mail cadastrado.</span></span></label>
        <label className="flex items-start gap-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 cursor-pointer"><input type="checkbox" checked={whatsapp} onChange={event => setWhatsapp(event.target.checked)} className="mt-1 h-4 w-4 accent-indigo-600" /><span><span className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100"><MessageCircle className="w-4 h-4 text-indigo-600" /> WhatsApp — consentimento explícito</span><span className="block mt-1 text-xs text-slate-600 dark:text-slate-400">Autorizar o envio de notificações operacionais para o telefone desta conta. A autorização não libera envio para terceiros nem altera o canal configurado pela empresa.</span></span></label>
        <div className="flex items-center justify-between gap-3 pt-2"><span className="text-[11px] text-slate-500">Você pode alterar esta decisão a qualquer momento.</span><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Salvar preferências</button></div>
      </div>}

      {isDriver && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/20 p-5 space-y-4">
          <div className="flex items-start gap-3"><MapPin className="mt-0.5 w-5 h-5 text-sky-600 shrink-0" /><div><h2 className="font-black text-slate-900 dark:text-white">Alertas por proximidade</h2><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Quando ativado, o PWA atualiza sua posição enquanto o painel estiver aberto e você poderá receber alertas de fretes próximos da coleta. A localização não é exibida na lista administrativa nem compartilhada com outras empresas.</p></div></div>
          <label className="flex items-start gap-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-white/70 dark:bg-slate-900/60 p-4 cursor-pointer"><input type="checkbox" checked={proximityEnabled} onChange={event => void saveDriverProximity(event.target.checked)} disabled={savingGeo} className="mt-1 h-4 w-4 accent-sky-600" /><span><span className="font-bold text-sm text-slate-800 dark:text-slate-100">Permitir alertas por proximidade</span><span className="block mt-1 text-xs text-slate-500">É necessário permitir a localização no navegador. Você pode revogar esta permissão a qualquer momento.</span></span></label>
        </div>
      )}

      {showFreightAlerts && canConfigureCompany && geoConfig && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20 p-5 space-y-4">
          <div><h2 className="font-black text-slate-900 dark:text-white">Política de alertas geográficos da empresa</h2><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">O filtro usa a origem do frete e a última posição autorizada do motorista. Quando não há GPS atual, o fallback regional evita bloquear todos os alertas.</p></div>
          <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={geoConfig.geographicFilterEnabled !== false} onChange={event => setGeoConfig({ ...geoConfig, geographicFilterEnabled: event.target.checked })} className="h-4 w-4 accent-amber-600" /> Ativar filtro geográfico</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Raio da coleta (km)<input type="number" min="1" max="500" step="0.1" value={geoConfig.radiusKm} onChange={event => setGeoConfig({ ...geoConfig, radiusKm: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Sem GPS atual, usar<select value={geoConfig.fallbackRegion} onChange={event => setGeoConfig({ ...geoConfig, fallbackRegion: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="CITY">mesma cidade e UF</option><option value="STATE">mesma UF</option><option value="NONE">não enviar</option></select></label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">GPS válido por (minutos)<input type="number" min="1" max="1440" value={geoConfig.maxLocationAgeMinutes} onChange={event => setGeoConfig({ ...geoConfig, maxLocationAgeMinutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Precisão máxima (metros)<input type="number" min="10" max="50000" value={geoConfig.maxAccuracyMeters} onChange={event => setGeoConfig({ ...geoConfig, maxAccuracyMeters: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          </div>
          <label className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={geoConfig.requireCurrentLocation === true} onChange={event => setGeoConfig({ ...geoConfig, requireCurrentLocation: event.target.checked })} className="mt-0.5 h-4 w-4 accent-amber-600" /> Exigir GPS atual; quando marcado, motoristas sem localização válida não recebem alertas.</label>
          <button type="button" onClick={() => void saveGeoConfig()} disabled={savingGeo} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50">{savingGeo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Salvar política geográfica</button>
        </div>
      )}

      {message && <p role="status" className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">{message}</p>}
    </section>
  );
};
