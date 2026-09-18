import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressData {
  address: string;
  city: string;
  state: string;
  number?: string;
  neighborhood?: string;
  zipCode?: string;
  mapboxPlaceId?: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onSelect: (data: AddressData) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = 'Buscar endereço...',
  className = '',
  required = false
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    onSelect({ address: text, city: '', state: '' }); // Atualiza o form pai com o texto puro inicialmente

    if (timerRef.current) clearTimeout(timerRef.current);

    if (text.trim().length < 4) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const results = await api.geocode(`${text}, Brasil`);
        setSuggestions(results || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item: any) => {
    const data: AddressData = {
      address: item.address || item.placeName?.split(',')[0] || '',
      city: item.city || '',
      state: item.state || '',
      number: item.number,
      neighborhood: item.neighborhood,
      zipCode: item.zipCode,
      mapboxPlaceId: item.id,
      lat: item.lat,
      lng: item.lng
    };
    
    setQuery(data.address);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(data);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          required={required}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 pl-9 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {suggestions.map((item, index) => (
            <li
              key={item.id || index}
              onClick={() => handleSelect(item)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200"
            >
              <div className="font-medium text-slate-900 dark:text-white">
                {item.address || item.placeName?.split(',')[0] || 'Endereço encontrado'}
              </div>
              <div className="text-xs text-slate-500">
                {[item.city, item.state].filter(Boolean).join(' - ')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
