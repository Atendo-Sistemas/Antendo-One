import React, { useEffect, useState } from 'react';
import { Globe, Save, Search } from 'lucide-react';
import { SaaSGlobalConfig, SeoConfig } from '../../types';

interface Props {
  config: SaaSGlobalConfig;
  onUpdateConfig: (updated: Partial<SaaSGlobalConfig>) => Promise<void>;
  saving?: boolean;
}

const defaults: SeoConfig = {
  siteName: 'Elo Log',
  title: 'Elo Log — Gestão e publicação de fretes',
  description: 'Plataforma de gestão logística para transportadoras, motoristas e operações de fretes.',
  keywords: 'gestão de fretes, transportadora, logística, rastreamento',
  canonicalUrl: 'https://gestor.atendo.log.br',
  ogImageUrl: '',
  locale: 'pt_BR',
  allowIndexing: true
};

export const SeoConfigPanel: React.FC<Props> = ({ config, onUpdateConfig, saving }) => {
  const [seo, setSeo] = useState<SeoConfig>({ ...defaults, ...(config.seo || {}) });
  const [notice, setNotice] = useState('');
  useEffect(() => setSeo({ ...defaults, ...(config.seo || {}) }), [config.seo]);
  const update = (key: keyof SeoConfig, value: string | boolean) => setSeo(prev => ({ ...prev, [key]: value } as SeoConfig));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await onUpdateConfig({ seo });
    setNotice('Configuração SEO salva e aplicada.');
    window.setTimeout(() => setNotice(''), 4000);
  };
  return <form onSubmit={save} className="space-y-6">
    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500" /> SEO da home e conteúdo público</h3>
      <p className="text-[11px] text-slate-400 mt-1">Edite os metadados que aparecem nos buscadores e nas prévias de compartilhamento. Áreas autenticadas nunca são indexadas.</p>
    </div>
    {notice && <div className="rounded-lg bg-emerald-50 text-emerald-800 px-3 py-2 text-xs font-semibold">{notice}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome do site<input value={seo.siteName} onChange={e => update('siteName', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" /></label>
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL canônica<input type="url" required value={seo.canonicalUrl} onChange={e => update('canonicalUrl', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" placeholder="https://exemplo.com" /></label>
      <label className="sm:col-span-2 text-xs font-bold text-slate-700 dark:text-slate-300">Título SEO<input required maxLength={65} value={seo.title} onChange={e => update('title', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" /><span className="block text-[10px] text-slate-400 mt-1">Até 65 caracteres recomendados.</span></label>
      <label className="sm:col-span-2 text-xs font-bold text-slate-700 dark:text-slate-300">Descrição SEO<textarea required maxLength={170} rows={3} value={seo.description} onChange={e => update('description', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" /><span className="block text-[10px] text-slate-400 mt-1">Até 170 caracteres recomendados.</span></label>
      <label className="sm:col-span-2 text-xs font-bold text-slate-700 dark:text-slate-300">Palavras-chave (opcional)<input value={seo.keywords || ''} onChange={e => update('keywords', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" placeholder="logística, fretes, transportadora" /></label>
      <label className="sm:col-span-2 text-xs font-bold text-slate-700 dark:text-slate-300">Imagem Open Graph (opcional)<input type="url" value={seo.ogImageUrl || ''} onChange={e => update('ogImageUrl', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" placeholder="https://exemplo.com/imagem.jpg" /></label>
    </div>
    <label className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-xs text-slate-700 dark:text-slate-200"><input type="checkbox" checked={seo.allowIndexing} onChange={e => update('allowIndexing', e.target.checked)} className="mt-0.5 rounded text-emerald-600" /><span><strong>Permitir indexação pública</strong><span className="block text-[10px] text-slate-500 mt-1">Desmarque para colocar a home e conteúdos públicos em noindex. Isto não substitui a proteção de rotas privadas.</span></span></label>
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 flex gap-2"><Search className="w-4 h-4 text-emerald-500 shrink-0" /><span>O sitemap será atualizado automaticamente com as páginas e posts globais publicados e indexáveis.</span></div>
    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800"><button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar configuração SEO'}</button></div>
  </form>;
};
