import React, { useEffect, useState } from 'react';
import { budgetApi, clientApi } from '../../services/api';
import { Budget, Client, BudgetExpense } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AddressAutocomplete } from '../common/AddressAutocomplete';

const empty = { clientId: undefined, clientName: '', date: new Date().toISOString().substring(0, 10), origin: { address: '', city: '', state: '' }, destination: { address: '', city: '', state: '' }, distanceKm: 0, pricePerKm: 0, tolls: 0, insurance: 0, cargoType: '', dailyRate: 0, dailyCount: 0, assistantCount: 0, assistantDailyRate: 0, driverPassed: 0, driverPaid: 0, priceTableReference: '', status: 'RASCUNHO' as const, profitValue: 15, expenses: [] };

export const BudgetManager: React.FC = () => {
  const [items, setItems] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Budget | null>(null);
  const [draft, setDraft] = useState<any>(empty);
  const [search, setSearch] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [preview, setPreview] = useState({ routeCost: 0, expenseTotal: 0, subtotal: 0, taxes: 0, cost: 0, profit: 0, total: 0 });

  const refresh = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([budgetApi.list(search), clientApi.list()]);
      setItems(b);
      setClients(c);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [search]);

  useEffect(() => {
    if (!draft) return;
    const expenseTotal = (draft.expenses || []).reduce((sum: number, e: BudgetExpense) => sum + (e.quantity * e.unitPrice), 0);
    const routeCost = (draft.distanceKm || 0) * (draft.pricePerKm || 0);
    const helpers = (draft.assistantCount || 0) * (draft.assistantDailyRate || 0) * (draft.dailyCount || 0);
    const daily = (draft.dailyRate || 0) * (draft.dailyCount || 0);
    const subtotal = expenseTotal + routeCost + (draft.tolls || 0) + (draft.insurance || 0) + helpers + daily;
    const taxes = subtotal * 0.15; // 15% impostos
    const cost = subtotal + taxes;
    const profit = cost * ((draft.profitValue || 0) / 100);
    const total = cost + profit;
    setPreview({ routeCost, expenseTotal, subtotal, taxes, cost, profit, total });
  }, [draft]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...draft, totalValue: preview.total };
      const item = selected ? await budgetApi.update(selected.id, payload) : await budgetApi.create(payload);
      setSelected(item);
      setDraft(item);
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const status = async (s: Budget['status']) => {
    if (!selected) return;
    setError('');
    try {
      await budgetApi.updateStatus(selected.id, s);
      const updated = { ...selected, status: s };
      setSelected(updated);
      setDraft(updated);
      await refresh();
    } catch (e: any) { setError(e.message); }
  };

  const lookupClient = async () => {
    if (!cnpj) return;
    setCnpjLoading(true);
    try {
      const r = await clientApi.lookupCnpj(cnpj);
      const data = r.data;
      const c = await clientApi.create({
        cnpj: r.cnpj, legalName: data.razao_social, tradeName: data.estabelecimento?.nome_fantasia,
        email: data.estabelecimento?.email, phone: data.estabelecimento?.telefone1,
        city: data.estabelecimento?.cidade?.nome, state: data.estabelecimento?.estado?.sigla
      });
      setDraft({ ...draft, clientId: c.id, clientName: c.legalName });
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setCnpjLoading(false); }
  };

  const calculateRoute = async () => {
    if (!draft.origin?.city || !draft.destination?.city) return setError('Informe as cidades de origem e destino.');
    setRouteLoading(true);
    try {
      const r = await budgetApi.calculateRoute(draft.origin, draft.destination);
      setDraft({ ...draft, distanceKm: r.distanceKm, tolls: r.estimatedTolls });
    } catch (e: any) { setError(e.message); }
    finally { setRouteLoading(false); }
  };

  const convert = async () => {
    if (!selected) return;
    try {
      await budgetApi.convertToFreight(selected.id);
      await refresh();
    } catch (e: any) { setError(e.message); }
  };

  const downloadPdf = () => {
    if (!selected) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Orçamento #${selected.id.substring(0, 8)}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Cliente: ${draft.clientName}`, 14, 30);
    doc.text(`Data: ${draft.date}`, 14, 38);
    autoTable(doc, {
      startY: 50,
      head: [['Item', 'Valor']],
      body: [
        ['Custo da Rota', `R$ ${preview.routeCost.toFixed(2)}`],
        ['Despesas', `R$ ${preview.expenseTotal.toFixed(2)}`],
        ['Impostos (15%)', `R$ ${preview.taxes.toFixed(2)}`],
        ['Lucro Estimado', `R$ ${preview.profit.toFixed(2)}`],
        ['Total Geral', `R$ ${preview.total.toFixed(2)}`]
      ],
    });
    doc.save(`orcamento-${selected.id.substring(0, 8)}.pdf`);
  };

  const printPdf = () => {
    if (!selected) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Orçamento #${selected.id.substring(0, 8)}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Cliente: ${draft.clientName}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Resumo Financeiro', 'Valor']],
      body: [['Total', `R$ ${preview.total.toFixed(2)}`]],
    });
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const addExpense = () => {
    setDraft({ ...draft, expenses: [...(draft.expenses || []), { id: crypto.randomUUID(), description: 'Nova despesa', quantity: 1, unitPrice: 0 }] });
  };

  const addressField = (key: 'origin' | 'destination', label: string, placeholder: string) => {
    const val = draft[key] || { address: '', city: '', state: '' };
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="font-bold text-sm mb-3">{label}</h3>
        <div className="space-y-3">
          <label className="text-xs font-semibold block">
            Endereço Completo
            <AddressAutocomplete
              value={val.address}
              placeholder={placeholder}
              className="mt-1"
              onSelect={(data) => {
                setDraft({
                  ...draft,
                  [key]: {
                    ...val,
                    address: data.address,
                    city: data.city || val.city,
                    state: data.state || val.state
                  }
                });
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold block">
              Cidade
              <input 
                value={val.city || ''} 
                onChange={e => setDraft({ ...draft, [key]: { ...val, city: e.target.value } })} 
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" 
              />
            </label>
            <label className="text-xs font-semibold block">
              Estado (UF)
              <input 
                value={val.state || ''} 
                maxLength={2}
                onChange={e => setDraft({ ...draft, [key]: { ...val, state: e.target.value.toUpperCase() } })} 
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 uppercase" 
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Comercial</p>
          <h1 className="text-2xl font-black">Orçamentos</h1>
        </div>
        <button onClick={() => { setSelected(null); setDraft(empty); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white cursor-pointer hover:bg-indigo-700">
          Novo orçamento
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar orçamento..." className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm" />
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 py-4">Carregando...</p>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                onClick={() => { setSelected(item); setDraft(item); }}
                className={`w-full rounded-xl border p-3 text-left cursor-pointer transition-colors ${selected?.id === item.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div className="font-bold flex items-center justify-between">
                  {item.clientName || 'Sem cliente'}
                  <span className="text-[10px] uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{item.status}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {item.origin.city} → {item.destination.city}
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-1">{brl(item.totalValue)}</div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Cliente
              <select value={draft.clientId || ''} onChange={e => {
                const c = clients.find(x => x.id === e.target.value);
                setDraft({ ...draft, clientId: c?.id || undefined, clientName: c?.legalName || draft.clientName });
              }} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2">
                <option value="">Selecione ou informe abaixo</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.legalName} · {client.cnpj}</option>)}
              </select>
              <input value={draft.clientName || ''} onChange={e => setDraft({ ...draft, clientId: undefined, clientName: e.target.value })} placeholder="Nome manual" className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>

            <label className="text-sm font-semibold">Buscar por CNPJ
              <div className="mt-1 flex gap-2">
                <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
                <button type="button" onClick={() => void lookupClient()} disabled={cnpjLoading} className="rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white disabled:opacity-50 cursor-pointer hover:bg-indigo-700">
                  {cnpjLoading ? 'Consultando…' : 'Consultar e salvar'}
                </button>
              </div>
            </label>

            <label className="text-sm font-semibold">Data
              <input type="date" value={draft.date || ''} onChange={e => setDraft({ ...draft, date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {addressField('origin', 'Origem', 'Endereço de coleta')}
            {addressField('destination', 'Destino', 'Endereço de entrega')}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => void calculateRoute()} disabled={routeLoading} className="rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900 px-4 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 disabled:opacity-50 cursor-pointer hover:bg-indigo-100">
              {routeLoading ? 'Calculando rota…' : 'Calcular rota e pedágios automaticamente'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold">Tipo de carga
              <input value={draft.cargoType || ''} onChange={e => setDraft({ ...draft, cargoType: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Distância (km)
              <input type="number" min="0" value={draft.distanceKm || 0} onChange={e => setDraft({ ...draft, distanceKm: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Valor por km rodado (R$/km)
              <input type="number" min="0" step="0.01" value={draft.pricePerKm || 0} onChange={e => setDraft({ ...draft, pricePerKm: Number(e.target.value) })} placeholder="Ex.: 4.50" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Cálculo: distância × valor por km = custo da rota.</span>
            </label>
            <label className="text-sm font-semibold">Tabela de preços
              <input value={draft.priceTableReference || ''} onChange={e => setDraft({ ...draft, priceTableReference: e.target.value })} placeholder="Referência manual" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Pedágios Estimados
              <input type="number" min="0" step="0.01" value={draft.tolls || 0} onChange={e => setDraft({ ...draft, tolls: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Seguro (GRIS/Ad-Valorem)
              <input type="number" min="0" step="0.01" value={draft.insurance || 0} onChange={e => setDraft({ ...draft, insurance: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Diária do Motorista
              <input type="number" min="0" step="0.01" value={draft.dailyRate || 0} onChange={e => setDraft({ ...draft, dailyRate: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Quantidade de Diárias
              <input type="number" min="0" value={draft.dailyCount || 0} onChange={e => setDraft({ ...draft, dailyCount: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Quantidade de Ajudantes
              <input type="number" min="0" value={draft.assistantCount || 0} onChange={e => setDraft({ ...draft, assistantCount: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Valor Diário (Por Ajudante)
              <input type="number" min="0" step="0.01" value={draft.assistantDailyRate || 0} onChange={e => setDraft({ ...draft, assistantDailyRate: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">Despesas Extras da Viagem</h2>
              <button onClick={addExpense} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold cursor-pointer hover:bg-slate-50">
                Adicionar despesa
              </button>
            </div>
            
            {(draft.expenses || []).map((expense: BudgetExpense, index: number) => (
              <div key={expense.id} className="mt-2 flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <input 
                  value={expense.description} 
                  onChange={e => { const expenses = [...draft.expenses]; expenses[index] = { ...expense, description: e.target.value }; setDraft({ ...draft, expenses }); }} 
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-sm" 
                  placeholder="Descrição da despesa (ex: Chapa, Balsa)"
                />
                <input 
                  type="number" min="0" 
                  value={expense.quantity} 
                  onChange={e => { const expenses = [...draft.expenses]; expenses[index] = { ...expense, quantity: Number(e.target.value) }; setDraft({ ...draft, expenses }); }} 
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-sm text-center" 
                  title="Quantidade"
                />
                <input 
                  type="number" min="0" step="0.01" 
                  value={expense.unitPrice} 
                  onChange={e => { const expenses = [...draft.expenses]; expenses[index] = { ...expense, unitPrice: Number(e.target.value) }; setDraft({ ...draft, expenses }); }} 
                  className="w-28 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-sm text-right" 
                  title="Valor Unitário (R$)"
                />
                <button 
                  onClick={() => {
                    const expenses = [...draft.expenses];
                    expenses.splice(index, 1);
                    setDraft({ ...draft, expenses });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                  title="Remover despesa"
                >
                  &times;
                </button>
              </div>
            ))}
            {(!draft.expenses || draft.expenses.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">Nenhuma despesa extra adicionada.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <label className="text-sm font-semibold">Lucro Previsto (%)
              <input type="number" value={draft.profitValue || 0} onChange={e => setDraft({ ...draft, profitValue: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Valor Passado ao Motorista
              <input type="number" value={draft.driverPassed || 0} onChange={e => setDraft({ ...draft, driverPassed: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-sm font-semibold">Valor Pago ao Motorista
              <input type="number" value={draft.driverPaid || 0} onChange={e => setDraft({ ...draft, driverPaid: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-900 dark:bg-black p-5 text-white md:grid-cols-6 mt-6 shadow-inner">
            <div>
              <span className="text-xs text-slate-400">Despesas</span>
              <strong className="block text-sm">{brl(preview.expenseTotal)}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400">Rota (Km + Tolls)</span>
              <strong className="block text-sm">{brl(preview.routeCost + (draft.tolls || 0))}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400">Impostos Estimados</span>
              <strong className="block text-sm">{brl(preview.taxes)}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400">Custo Total Estimado</span>
              <strong className="block text-sm">{brl(preview.cost)}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400">Lucro Estimado</span>
              <strong className="block text-sm">{brl(preview.profit)}</strong>
            </div>
            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-700 pt-2 md:pt-0 md:pl-4">
              <span className="text-xs text-emerald-300">Total do Frete</span>
              <strong className="block text-lg text-emerald-300">{brl(preview.total)}</strong>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap gap-3">
            <button onClick={save} disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer hover:bg-emerald-700 shadow-md">
              {saving ? 'Salvando…' : 'Salvar Orçamento'}
            </button>
            
            {selected && (
              <>
                <button onClick={downloadPdf} className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  Baixar PDF
                </button>
                <button onClick={printPdf} className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  Imprimir
                </button>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
                <button onClick={() => status('EM_ANALISE')} className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-4 py-2 text-sm font-bold cursor-pointer hover:bg-blue-100">
                  Enviar para Análise
                </button>
                <button onClick={() => status('APROVADO')} className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 text-sm font-bold cursor-pointer hover:bg-emerald-100">
                  Marcar Aprovado
                </button>
                <button onClick={convert} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white cursor-pointer hover:bg-indigo-700 shadow-sm ml-auto">
                  Converter em Frete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BudgetManager;
