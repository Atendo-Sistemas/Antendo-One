import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { ShieldCheck, Truck, Building2, UserPlus, Users, Sparkles, X } from 'lucide-react';

interface DemoSwitcherProps {
  onOpenRegisterDriver?: () => void;
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({ onOpenRegisterDriver }) => {
  const { user, switchUser, loading } = useAuth();
  const { config } = useSaaS();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem('hide_demo_switcher') === 'true';
  });

  // Hide if explicitly dismissed locally OR if SaaS config disables demo switcher in production
  if (dismissed || (config && config.showDemoSwitcher === false)) {
    return null;
  }

  const presets = [
    {
      id: 'user-superadmin',
      label: 'Super Admin SaaS',
      role: 'SUPER_ADMIN',
      icon: ShieldCheck,
      color: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    {
      id: 'user-admin-1',
      label: 'Empresa Admin (Mariana)',
      role: 'ADMIN',
      icon: Building2,
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      id: 'user-driver-joao',
      label: 'Motorista (João - Truck)',
      role: 'MOTORISTA',
      icon: Truck,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      id: 'user-driver-carlos',
      label: 'Motorista (Carlos - Toco)',
      role: 'MOTORISTA',
      icon: Truck,
      color: 'bg-teal-600 hover:bg-teal-700 text-white'
    },
    {
      id: 'user-supervisor-1',
      label: 'Supervisor (Roberto)',
      role: 'SUPERVISOR',
      icon: Users,
      color: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  ];

  const handleDismiss = () => {
    localStorage.setItem('hide_demo_switcher', 'true');
    setDismissed(true);
  };

  return (
    <div id="demo-account-switcher" className="w-full max-w-full bg-slate-900 text-slate-200 px-3 py-2 text-xs border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2 font-medium shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Alternar Perfil para Teste:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
        {presets.map(p => {
          const isActive = user?.id === p.id;
          const Icon = p.icon;
          return (
            <button
              id={`switch-to-${p.id}`}
              key={p.id}
              disabled={loading}
              onClick={() => switchUser(p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all text-xs cursor-pointer shrink-0 ${
                isActive 
                  ? 'ring-2 ring-white/80 font-bold shadow-md ' + p.color
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{p.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-ping"></span>}
            </button>
          );
        })}

        {onOpenRegisterDriver && (
          <button
            id="btn-open-register-driver"
            onClick={onOpenRegisterDriver}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md font-medium bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
            <span className="whitespace-nowrap">+ Novo Motorista</span>
          </button>
        )}

        <button
          onClick={handleDismiss}
          title="Ocultar barra de teste para este navegador"
          className="flex items-center gap-1 px-2 py-1 rounded-md font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
        >
          <X className="w-3.5 h-3.5 text-rose-400" />
          <span className="whitespace-nowrap text-[11px]">Ocultar</span>
        </button>
      </div>
    </div>
  );
};
