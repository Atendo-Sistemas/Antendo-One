import { useEffect, useMemo, useState } from 'react';
import { Image, Megaphone, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { api, userFacingError } from '../../services/api';
import { AdBanner, AdBannerFormat, AdBannerPlacement, Tenant, User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

type BannerDraft = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  openInNewTab: boolean;
  format: AdBannerFormat;
  placements: AdBannerPlacement[];
  targetRoles: UserRole[];
  targetTenantIds: string[];
  targetUserIds: string[];
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  priority: number;
};

const roles: Array<[UserRole, string]> = [
  ['SUPER_ADMIN', 'Super Admin'],
  ['EMPRESA_SUPER_ADMIN', 'Super Admin da empresa'],
  ['ADMIN', 'Administrador'],
  ['SUPERVISOR', 'Supervisor'],
  ['USUARIO', 'Usuário'],
  ['MOTORISTA', 'Motorista']
];
const placements: Array<[AdBannerPlacement, string]> = [
  ['HOME', 'Início'],
  ['FREIGHTS', 'Fretes'],
  ['OPERATIONS', 'Central de operação'],
  ['DRIVER_PORTAL', 'Portal do motorista'],
  ['DASHBOARD', 'Painel geral']
];
const formats: Array<[AdBannerFormat, string]> = [
  ['STRIP', 'Faixa horizontal'],
  ['CARD', 'Card'],
  ['SIDEBAR', 'Lateral'],
  ['MODAL', 'Destaque modal']
];

const emptyDraft = (): BannerDraft => ({
  title: '', imageUrl: '', linkUrl: '', openInNewTab: true, format: 'CARD', placements: ['DASHBOARD'],
  targetRoles: [], targetTenantIds: [], targetUserIds: [], isActive: true, startsAt: '', endsAt: '', priority: 0
});

function toDraft(banner: AdBanner): BannerDraft {
  return {
    title: banner.title, imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || '', openInNewTab: banner.openInNewTab,
    format: banner.format, placements: banner.placements, targetRoles: banner.targetRoles, targetTenantIds: banner.targetTenantIds,
    targetUserIds: banner.targetUserIds, isActive: banner.isActive, startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : '',
    endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : '', priority: banner.priority
  };
}

export function AdBannerSlot({ placement = 'DASHBOARD', className = '' }: { placement?: AdBannerPlacement; className?: string }) {
  const { user } = useAuth();
  const [banners, setBanners] = useState<AdBanner[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!user) return undefined;
    void api.getVisibleAdBanners(placement).then(items => { if (!cancelled) setBanners(items); }).catch(() => { if (!cancelled) setBanners([]); });
    return () => { cancelled = true; };
  }, [user?.id, placement]);
  if (!banners.length) return null;
  return <div className={`space-y-3 ${className}`} aria-label="Comunicações da plataforma">
    {banners.map(banner => (
      <a key={banner.id} href={banner.linkUrl || undefined} target={banner.openInNewTab ? '_blank' : undefined} rel={banner.openInNewTab ? 'noopener noreferrer' : undefined} className={`group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${banner.linkUrl ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`} onClick={event => { if (!banner.linkUrl) event.preventDefault(); }}>
        <img src={banner.imageUrl} alt={banner.title} className={`w-full object-cover ${banner.format === 'STRIP' ? 'max-h-28' : banner.format === 'SIDEBAR' ? 'max-h-48' : 'max-h-72'}`} loading="lazy" />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{banner.title}</span>
          {banner.linkUrl && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Saiba mais</span>}
        </div>
      </a>
    ))}
  </div>;
}

export default function AdBannersPanel() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BannerDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selected = useMemo(() => banners.find(item => item.id === selectedId) || null, [banners, selectedId]);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [bannerItems, tenantItems, userItems] = await Promise.all([api.getAdBanners(), api.getTenants(), api.getUsers()]);
      setBanners(bannerItems); setTenants(tenantItems); setUsers(userItems);
    } catch (err) { setError(userFacingError(err, 'Não foi possível carregar as propagandas.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (user?.role === 'SUPER_ADMIN') void load(); }, [user?.id, user?.role]);

  const update = <K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) => setDraft(prev => ({ ...prev, [key]: value }));
  const toggleArray = <T extends string>(key: 'placements' | 'targetRoles' | 'targetTenantIds' | 'targetUserIds', value: T) => {
    setDraft(prev => ({ ...prev, [key]: (prev[key] as T[]).includes(value) ? (prev[key] as T[]).filter(item => item !== value) : [...(prev[key] as T[]), value] }));
  };
  const startNew = () => { setSelectedId(null); setDraft(emptyDraft()); setMessage(''); setError(''); };
  const selectBanner = (banner: AdBanner) => { setSelectedId(banner.id); setDraft(toDraft(banner)); setMessage(''); setError(''); };
  const save = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const saved = selectedId ? await api.updateAdBanner(selectedId, draft) : await api.createAdBanner(draft);
      setBanners(prev => selectedId ? prev.map(item => item.id === saved.id ? saved : item) : [saved, ...prev]);
      setSelectedId(saved.id); setDraft(toDraft(saved)); setMessage('Propaganda salva com sucesso.');
    } catch (err) { setError(userFacingError(err, 'Não foi possível salvar a propaganda.')); }
    finally { setSaving(false); }
  };
  const remove = async (banner: AdBanner) => {
    if (!window.confirm(`Remover a propaganda “${banner.title}”?`)) return;
    try { await api.deleteAdBanner(banner.id); setBanners(prev => prev.filter(item => item.id !== banner.id)); if (selectedId === banner.id) startNew(); setMessage('Propaganda removida.'); }
    catch (err) { setError(userFacingError(err, 'Não foi possível remover a propaganda.')); }
  };

  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-widest text-purple-600">Comunicação segmentada</p><h2 className="mt-1 flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white"><Megaphone className="h-5 w-5" /> Propagandas e banners</h2><p className="mt-1 text-sm text-slate-500">Crie uma comunicação visual e escolha exatamente onde, para qual empresa e para quais perfis ela será exibida.</p></div>
      <button type="button" onClick={startNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700"><Plus className="h-4 w-4" /> Nova propaganda</button>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Propagandas cadastradas</h3>{loading && <span className="text-xs text-slate-400">Carregando…</span>}</div>
        {banners.length === 0 && !loading && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Nenhuma propaganda cadastrada.</p>}
        {banners.map(banner => <div key={banner.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${selectedId === banner.id ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/20' : 'border-slate-200 dark:border-slate-700'}`}><img src={banner.imageUrl} alt="" className="h-14 w-20 rounded-lg object-cover" /><button type="button" onClick={() => selectBanner(banner)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{banner.title}</span><span className="text-xs text-slate-500">{banner.isActive ? 'Ativa' : 'Pausada'} · {banner.placements.join(', ')}</span></button><button type="button" onClick={() => void remove(banner)} aria-label="Remover" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}
      </div>
      <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">{selected ? <><Pencil className="h-4 w-4" /> Editar propaganda</> : <><Plus className="h-4 w-4" /> Nova propaganda</>}</h3>{selected && <button type="button" onClick={startNew} className="text-xs font-bold text-slate-500 hover:text-slate-900">Limpar</button>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">Título<input value={draft.title} onChange={e => update('title', e.target.value)} maxLength={120} required className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" placeholder="Ex.: Seguro para sua frota" /></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">Imagem (URL HTTPS ou caminho interno)<input type="url" value={draft.imageUrl} onChange={e => update('imageUrl', e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" placeholder="https://.../banner.jpg" /></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">Link de direcionamento (opcional)<input type="url" value={draft.linkUrl} onChange={e => update('linkUrl', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" placeholder="https://..." /></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Formato<select value={draft.format} onChange={e => update('format', e.target.value as AdBannerFormat)} className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700">{formats.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prioridade<input type="number" min={0} max={999} value={draft.priority} onChange={e => update('priority', Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" /></label>
          <fieldset className="sm:col-span-2"><legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Locais de exibição</legend><div className="mt-2 flex flex-wrap gap-2">{placements.map(([value, label]) => <label key={value} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-semibold dark:bg-slate-800"><input type="checkbox" checked={draft.placements.includes(value)} onChange={() => toggleArray('placements', value)} />{label}</label>)}</div></fieldset>
          <fieldset className="sm:col-span-2"><legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Perfis autorizados <span className="font-normal text-slate-500">(vazio = todos)</span></legend><div className="mt-2 flex flex-wrap gap-2">{roles.map(([value, label]) => <label key={value} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-semibold dark:bg-slate-800"><input type="checkbox" checked={draft.targetRoles.includes(value)} onChange={() => toggleArray('targetRoles', value)} />{label}</label>)}</div></fieldset>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Empresas <span className="font-normal text-slate-500">(Ctrl/Cmd para múltiplas)</span><select multiple value={draft.targetTenantIds} onChange={e => update('targetTenantIds', Array.from(e.currentTarget.selectedOptions as HTMLCollectionOf<HTMLOptionElement>).map(option => option.value))} className="mt-1 h-28 w-full rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700">{tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Usuários específicos <span className="font-normal text-slate-500">(opcional)</span><select multiple value={draft.targetUserIds} onChange={e => update('targetUserIds', Array.from(e.currentTarget.selectedOptions as HTMLCollectionOf<HTMLOptionElement>).map(option => option.value))} className="mt-1 h-28 w-full rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700">{users.map(item => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Início (opcional)<input type="datetime-local" value={draft.startsAt} onChange={e => update('startsAt', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" /></label>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fim (opcional)<input type="datetime-local" value={draft.endsAt} onChange={e => update('endsAt', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" /></label>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.openInNewTab} onChange={e => update('openInNewTab', e.target.checked)} /> Abrir link em nova janela</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.isActive} onChange={e => update('isActive', e.target.checked)} /> Publicada</label></div>
        <div className="rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-600"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><Image className="h-4 w-4" /> Pré-visualização</div>{draft.imageUrl ? <img src={draft.imageUrl} alt={draft.title || 'Pré-visualização'} className="max-h-48 w-full rounded-lg object-cover" /> : <div className="flex h-24 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400 dark:bg-slate-800">Informe a URL de uma imagem</div>}<p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{draft.title || 'Título da propaganda'}</p></div>
        <button type="button" onClick={() => void save()} disabled={saving || !draft.title.trim() || !draft.imageUrl.trim() || draft.placements.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Salvando…' : 'Salvar propaganda'}</button>
      </div>
    </div>
  </section>;
}
