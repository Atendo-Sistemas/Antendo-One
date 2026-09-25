import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { publicTrackingApi } from '../../services/api';

interface CepLookupFieldProps {
  value?: string;
  onChange: (value: string) => void;
  onFound: (data: { zipCode: string; address: string; neighborhood: string; city: string; state: string; complement?: string }) => void;
  className?: string;
}

export const CepLookupField: React.FC<CepLookupFieldProps> = ({ value = '', onChange, onFound, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const cep = value.replace(/\D/g, '').slice(0, 8);
  const formatted = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

  const lookup = async () => {
    if (cep.length !== 8) {
      setMessage('Informe 8 dígitos.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await publicTrackingApi.lookupCep(cep);
      onFound(data);
      setMessage('Endereço encontrado. Confira o número e selecione/ajuste a sugestão se necessário.');
    } catch (error: any) {
      setMessage(error.message || 'CEP não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={9}
          value={formatted}
          onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void lookup(); } }}
          placeholder="00000-000"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2"
          aria-label="CEP"
        />
        <button type="button" onClick={() => void lookup()} disabled={loading || cep.length !== 8} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 font-bold text-indigo-700 disabled:opacity-50" title="Pesquisar endereço pelo CEP">
          <Search className="h-3.5 w-3.5" /> {loading ? 'Buscando…' : 'Buscar CEP'}
        </button>
      </div>
      {message && <p className="mt-1 text-[10px] font-medium text-slate-500">{message}</p>}
    </div>
  );
};
