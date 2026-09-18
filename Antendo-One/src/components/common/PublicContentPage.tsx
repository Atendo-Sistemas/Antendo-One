import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { BlogPost, WebPage } from '../../types';
import { stripLeadingHeading } from '../../utils/sanitizeHtml';

type PublicItem = (WebPage | BlogPost) & { kind: 'page' | 'post' };
export const PublicContentPage: React.FC<{ slug: string }> = ({ slug }) => {
  const [item, setItem] = useState<PublicItem | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const section = window.location.pathname.startsWith('/elo-log/') ? 'elo-log' : 'conteudo';
    api.getPublicContent(slug, section).then(data => {
      if (!active) return;
      setItem(data as PublicItem);
      const title = data.metaTitle || data.title;
      document.title = title;
      const description = data.metaDescription || data.excerpt || '';
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = description;
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = data.canonicalUrl || window.location.href;
    }).catch(err => { if (active) setError(err.message || 'Conteúdo não encontrado.'); });
    return () => { active = false; };
  }, [slug]);
  if (error) return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="text-center"><h1 className="text-xl font-black text-slate-800">Conteúdo indisponível</h1><p className="text-sm text-slate-500 mt-2">{error}</p><a href="/" className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold"><ArrowLeft className="w-4 h-4" />Voltar à home</a></div></main>;
  if (!item) return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" /></main>;
  return <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"><header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between"><a href="/" className="text-sm font-black text-emerald-700 dark:text-emerald-400">ATENDO ONE</a><a href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"><ArrowLeft className="w-4 h-4" />Voltar</a></div></header><article className="max-w-4xl mx-auto px-5 py-12"><nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-slate-500"><a href="/" className="hover:text-emerald-700">Início</a><span className="mx-2">›</span><span>{(item as WebPage).publicPath === 'elo-log' ? 'Soluções' : 'Conteúdos'}</span><span className="mx-2">›</span><span aria-current="page">{item.title}</span></nav><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600"><FileText className="w-4 h-4" />{item.kind === 'post' ? 'Artigo' : 'Página institucional'}</div><h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">{item.title}</h1>{item.excerpt && <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">{item.excerpt}</p>}<div className="mt-10 prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: stripLeadingHeading(item.content) }} /></article><footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">Atendo One • Gestão Logística Integrada</footer></main>;
};
