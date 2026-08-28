import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { CheckCircle, ExternalLink, FileText, Globe2, RefreshCw, Search, Settings2 } from 'lucide-react';

type PublicSeoItem = {
  slug: string;
  title: string;
  excerpt?: string;
  kind?: string;
  isPublished?: boolean;
  isIndexable?: boolean;
  metaTitle?: string;
  metaDescription?: string;
};

type PublicSeoData = {
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    allowIndexing?: boolean;
  };
  content?: PublicSeoItem[];
};

type Props = {
  onOpenContentManagement?: () => void;
  onOpenSeoConfig?: () => void;
};

export const AdminSeoOverviewPanel: React.FC<Props> = ({ onOpenContentManagement, onOpenSeoConfig }) => {
  const [data, setData] = useState<PublicSeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getPublicSeo());
    } catch (err: any) {
      setError(err?.message || 'Não foi possível consultar o SEO público.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = data?.content || [];
  const published = useMemo(() => items.filter(item => item.isPublished !== false), [items]);
  const indexable = useMemo(() => items.filter(item => item.isIndexable !== false), [items]);
  const seoActive = data?.seo?.allowIndexing !== false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Search className="w-4 h-4" /> Visão pública indexável
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">SEO e conteúdo em um só lugar</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Consulte o que está publicado, abra a página real e acesse rapidamente os editores. Esta leitura usa somente os dados públicos do catálogo e não expõe credenciais ou configurações privadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar leitura
          </button>
          <button type="button" onClick={onOpenSeoConfig} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <Settings2 className="w-4 h-4" /> Editar SEO
          </button>
          <button type="button" onClick={onOpenContentManagement} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            <FileText className="w-4 h-4" /> Gerenciar conteúdos
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status de indexação</p>
          <p className={`mt-2 text-lg font-black ${seoActive ? 'text-emerald-600' : 'text-rose-600'}`}>{seoActive ? 'Ativo' : 'Bloqueado'}</p>
          <p className="mt-1 text-xs text-slate-500">Controle global da home e conteúdos.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conteúdos catalogados</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{loading ? '—' : items.length}</p>
          <p className="mt-1 text-xs text-slate-500">Páginas e posts retornados pelo catálogo público.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Publicados</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{loading ? '—' : published.length}</p>
          <p className="mt-1 text-xs text-slate-500">Itens visíveis nas rotas públicas.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Indexáveis</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{loading ? '—' : indexable.length}</p>
          <p className="mt-1 text-xs text-slate-500">Itens elegíveis para sitemap e buscadores.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">Catálogo público acessível</h3>
            <p className="mt-1 text-xs text-slate-500">Abra a página publicada para conferir o resultado real.</p>
          </div>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"><Globe2 className="w-4 h-4" /> Ver sitemap</a>
        </div>
        {loading ? <div className="px-5 py-10 text-center text-sm text-slate-500">Carregando catálogo público…</div> : items.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhum conteúdo público foi retornado.</div> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(item => (
              <div key={item.slug} className="flex flex-col lg:flex-row lg:items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.title}</h4>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">{item.kind === 'post' ? 'Post' : 'Página'}</span>
                    {item.isIndexable !== false && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Indexável</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 truncate">/conteudo/{item.slug}</p>
                </div>
                <a href={`/conteudo/${encodeURIComponent(item.slug)}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-700"><ExternalLink className="w-3.5 h-3.5" /> Abrir página</a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
        <strong>Fluxo recomendado:</strong> use <em>Editar SEO</em> para os metadados globais, <em>Gerenciar conteúdos</em> para texto, slug, publicação e SEO individual, e <em>Abrir página</em> para conferir o resultado público sem sair do painel.
      </div>
    </div>
  );
};
