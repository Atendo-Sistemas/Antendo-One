import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '../../services/api';

const brl = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';

export const PublicExpensePage: React.FC<{ token: string }> = ({ token }) => {
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getPublicExpense(token).then(data => {
      if (!active) return;
      setReport(data);
      document.title = `${data.publicCode || 'Prestação de contas'} • ${data.companyName || 'Atendo One'}`;
    }).catch(err => { if (active) setError(err.message || 'Documento não encontrado.'); });
    return () => { active = false; };
  }, [token]);

  if (error) return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><XCircle className="mx-auto h-12 w-12 text-rose-500" /><h1 className="mt-4 text-xl font-black text-slate-900">Documento indisponível</h1><p className="mt-2 text-sm text-slate-500">{error}</p><a href="/" className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white">Ir para o Atendo One</a></div></main>;
  if (!report) return <main className="min-h-screen bg-slate-100 flex items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-emerald-600" /></main>;

  const isReturn = Number(report.balanceAmount) >= 0;
  return <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <header className="bg-slate-950 px-6 py-7 text-white sm:px-10"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Documento validado online</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{report.companyName}</h1><p className="mt-1 text-sm text-slate-300">Prestação de contas e despesas de viagem</p></div><div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Código de validação</p><strong className="font-mono text-lg text-white">{report.publicCode}</strong></div></div></header>
      <div className="space-y-7 p-6 sm:p-10">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><ShieldCheck className="h-5 w-5" /> Documento público somente para consulta; os dados são apresentados para validação.</div>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="label">Motorista</p><strong>{report.driverName}</strong></div><div><p className="label">Placa</p><strong>{report.vehiclePlate || 'Não informada'}</strong></div><div><p className="label">Referência</p><strong>{report.freightCode || 'Avulso'}</strong></div><div><p className="label">Status</p><strong>{report.status}</strong></div></section>
        <section className="rounded-2xl border border-slate-200 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black"><FileText className="h-4 w-4 text-emerald-600" />Resumo da viagem</h2><div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="label">Período</p><strong>{date(report.startDate)} a {date(report.endDate)}</strong></div><div><p className="label">Dias</p><strong>{report.tripDays}</strong></div><div><p className="label">Km rodado</p><strong>{Number(report.totalKm || 0).toLocaleString('pt-BR')} km</strong><small className="block text-xs text-slate-500">{report.initialKm} → {report.finalKm}</small></div><div><p className="label">Média combustível</p><strong>{Number(report.averageKmPerLiter || 0) > 0 ? `${Number(report.averageKmPerLiter).toFixed(2)} km/L` : 'Não informada'}</strong></div></div></section>
        <section><h2 className="mb-3 text-sm font-black">Despesas lançadas ({report.items?.length || 0})</h2><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Estabelecimento</th><th className="px-4 py-3 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-100">{(report.items || []).map((item: any, index: number) => <tr key={`${item.date}-${index}`}><td className="px-4 py-3">{date(item.date)}</td><td className="px-4 py-3 font-semibold">{item.description || item.category || 'Despesa'}</td><td className="px-4 py-3 text-slate-500">{item.establishmentName || '—'}</td><td className="px-4 py-3 text-right font-bold">{brl(item.amount)}</td></tr>)}</tbody></table></div></section>
        <section className="grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3"><div><p className="label">Adiantamento recebido</p><strong>{brl(report.advanceAmount)}</strong></div><div><p className="label">Total de despesas</p><strong>{brl(report.totalExpenses)}</strong></div><div className={isReturn ? 'text-emerald-700' : 'text-amber-700'}><p className="label">{isReturn ? 'Saldo a devolver' : 'Reembolso a receber'}</p><strong>{brl(Math.abs(report.balanceAmount))}</strong></div></section>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-6 py-5 text-xs text-slate-500 sm:px-10"><span>Atendo One • Gestão Logística Integrada</span><span>Validação: {report.publicCode}</span></footer>
    </div>
  </main>;
};
