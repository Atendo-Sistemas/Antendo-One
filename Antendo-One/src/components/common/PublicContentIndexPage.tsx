import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

type ContentItem = {
  slug: string;
  title: string;
  excerpt?: string;
  kind?: 'page' | 'post';
  publicPath?: 'conteudo' | 'elo-log';
};

export const PublicContentIndexPage: React.FC<{ section: 'conteudo' | 'elo-log' }> = ({ section }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getPublicSeo()
      .then(data => { if (active) setItems((data.content as ContentItem[]).filter(item => (item.publicPath === 'elo-log' ? 'elo-log' : 'conteudo') === section)); })
      .catch(err => { if (active) setError(err.message || 'Não foi possível carregar os conteúdos.'); });
    return () => { active = false; };
  }, [section]);

  const title = section === 'elo-log' ? 'Soluções para operações logísticas' : 'Conteúdos sobre transporte e gestão de fretes';
  const description = section === 'elo-log'
    ? 'Conheça as soluções do Atendo One para organizar fretes, transportadoras, motoristas, veículos, viagens e despesas.'
    : 'Guias práticos sobre TMS, publicação de fretes, motoristas, viagens, checklists, rastreamento e indicadores.';
  const visibleItems = useMemo(() => items.filter(item => !['politica-de-privacidade', 'termos-de-uso'].includes(item.slug)), [items]);

  return <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <a href="/" className="text-sm font-black text-emerald-700 dark:text-emerald-400">ATENDO ONE</a>
        <a href="/" className="text-xs font-bold text-slate-600 dark:text-slate-300">Voltar à home</a>
      </div>
    </header>
    <section className="max-w-6xl mx-auto px-5 py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs font-semibold text-slate-500"><a href="/" className="hover:text-emerald-700">Início</a><span className="mx-2">›</span><span aria-current="page">{section === 'elo-log' ? 'Soluções' : 'Conteúdos'}</span></nav>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Atendo One</p>
      <h1 className="mt-3 max-w-4xl text-3xl md:text-5xl font-black tracking-tight">{title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      {error && <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {!error && !items.length && <div className="mt-10 flex items-center gap-3 text-sm text-slate-500"><RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />Carregando conteúdos…</div>}
      {!!visibleItems.length && <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleItems.map(item => <a key={item.slug} href={`/${section}/${encodeURIComponent(item.slug)}`} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-600"><FileText className="h-4 w-4" />{item.kind === 'post' ? 'Artigo' : section === 'elo-log' ? 'Solução' : 'Conteúdo'}</div>
        <h2 className="mt-4 text-xl font-extrabold group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{item.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.excerpt || 'Conheça esta página do Atendo One.'}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Saiba mais <ArrowRight className="h-4 w-4" /></span>
      </a>)}</div>}
    </section>
  </main>;
};
