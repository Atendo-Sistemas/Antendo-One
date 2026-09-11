import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SaaSGlobalConfig, WhatsAppConfig, EmailConfig } from '../../types';
import { APP_VERSION, APP_BUILD_DATE, APP_RELEASE_NAME } from '../../version';
import { AsaasConfigPanel } from './AsaasConfigPanel';
import { 
  Settings, 
  Globe, 
  ShieldAlert, 
  Sliders, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  DollarSign, 
  Users, 
  Truck, 
  Lock,
  Eye,
  EyeOff,
  Palette,
  FileText,
  Database,
  Compass,
  BookOpen,
  Search,
  BarChart3
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { SqlAndInstallationConfig } from './SqlAndInstallationConfig';
import { MapboxConfigPanel } from './MapboxConfigPanel';
import { SeoConfigPanel } from './SeoConfigPanel';
import { NotificationTemplatesPanel } from './NotificationTemplatesPanel';
import { NotificationDeliveryLedger } from './NotificationDeliveryLedger';
import { ErrorLogPanel } from './ErrorLogPanel';
import { WhatsAppConfigModal } from '../common/WhatsAppConfigModal';
import { AdminSeoOverviewPanel } from './AdminSeoOverviewPanel';
import { VisitAnalyticsPanel } from './VisitAnalyticsPanel';
import { BackupMonitorPanel } from './BackupMonitorPanel';

type SaaSConfigPanelProps = { onOpenContentManagement?: () => void };

const DEFAULT_NOTIFICATION_MODULE: NonNullable<SaaSGlobalConfig['notificationModule']> = {
  enabled: true,
  freePlanName: 'WhatsApp SaaS — Gratuito',
  freePlanDescription: 'Notificações usando o telefone oficial da plataforma.',
  ownNumberPlanName: 'WhatsApp Próprio da Empresa',
  ownNumberPlanDescription: 'Notificações usando o número e canal WhatsApp da empresa.',
  ownNumberMonthlyPrice: 89.90,
  assistedActivationPrice: 149.90,
  extraNumberMonthlyPrice: 29.90
};

export const SaaSConfigPanel: React.FC<SaaSConfigPanelProps> = ({ onOpenContentManagement }) => {
  const { user } = useAuth();
  const isTestUser = user?.accountType === 'TEST' || user?.readOnly === true || (user?.accountType !== 'REAL' && Boolean(user?.id && /(?:test|demo)/i.test(user.id)));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'analytics' | 'branding' | 'plans' | 'rules' | 'gateway' | 'layout' | 'fields' | 'email' | 'sql-installation' | 'mapbox' | 'help' | 'seo' | 'notifications' | 'backups' | 'error-logs' | 'asaas'>('overview');
  const [selectedForm, setSelectedForm] = useState<'userForm' | 'freightForm' | 'driverForm' | 'expenseForm'>('freightForm');
  const [showToken, setShowToken] = useState(false);

  // SaaS configuration state
  const [config, setConfig] = useState<SaaSGlobalConfig | null>(null);

  // Help state
  const [helpRole, setHelpRole] = useState<'ADMIN' | 'SUPERVISOR' | 'USER' | 'DRIVER'>('ADMIN');
  const [helpContent, setHelpContent] = useState<Record<string, string>>({
    ADMIN: '',
    SUPERVISOR: '',
    USER: '',
    DRIVER: ''
  });

  // WhatsApp configuration state
  const [waConfig, setWaConfig] = useState<WhatsAppConfig | null>(null);
  const [waLocalSaving, setWaLocalSaving] = useState(false);

  // Test states
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Teste de integração do Atendo CRM. Configurações globais salvas com sucesso.');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showWhatsAppTenantModal, setShowWhatsAppTenantModal] = useState(false);

  useEffect(() => {
    loadAllConfigs();
  }, []);
  
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const [saasData, waData, helpData] = await Promise.all([
        api.getSaaSGlobalConfig(),
        api.getWhatsAppConfig(),
        api.getHelp()
      ]);

      const contentMap: Record<string, string> = {};
      helpData.forEach((h: { role: string, content: string }) => {
        contentMap[h.role] = h.content;
      });
      setHelpContent(contentMap);

      // Ensure layout configuration has secure defaults
      if (!saasData.layout) {
        saasData.layout = {
          primaryColor: '#059669',
          borderRadius: 'xl',
          fontFamily: 'sans',
          navbarStyle: 'dark',
          logoText: 'ATENDO ONE',
          systemBackground: 'minimal',
          homeBadgeText: 'Gestão completa para sua operação de transporte',
          homeTitle: 'Gestão e Publicação de Fretes em',
          homeTitleAccent: 'Tempo Real',
          homeSubtitle: 'O Atendo One conecta transportadoras, equipes e motoristas com segurança. Publique fretes, controle sua frota, execute checklists eletrônicos e acompanhe toda a operaç...'
        };
      } else {
        if (!saasData.layout.homeBadgeText) saasData.layout.homeBadgeText = 'Gestão completa para sua operação de transporte';
        if (!saasData.layout.homeTitle) saasData.layout.homeTitle = 'Gestão e Publicação de Fretes em';
        if (!saasData.layout.homeTitleAccent) saasData.layout.homeTitleAccent = 'Tempo Real';
        if (!saasData.layout.homeSubtitle) saasData.layout.homeSubtitle = 'O Atendo One conecta transportadoras, equipes e motoristas com segurança. Publique fretes, controle sua frota, execute checklists...';
      }

      saasData.notificationModule = {
        ...DEFAULT_NOTIFICATION_MODULE,
        ...(saasData.notificationModule || {})
      };

      // Ensure form field settings are present and initialized
      if (!saasData.formFields) {
        saasData.formFields = {
          userForm: [
            { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Ex: Carlos Oliveira', enabled: true, required: true },
            { id: 'email', originalLabel: 'E-mail Corporativo', label: 'E-mail Corporativo', placeholder: 'carlos@translog.com.br', enabled: true, required: true },
            { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(11) 98765-4321', enabled: true, required: true },
            { id: 'role', originalLabel: 'Nível de Permissão (Role)', label: 'Nível de Permissão (Role)', placeholder: '', enabled: true, required: true }
          ],
          freightForm: [
            { id: 'cargoDescription', originalLabel: 'Descrição da Carga', label: 'Descrição da Carga', placeholder: 'Ex: Carga geral paletizada - Peças industriais', enabled: true, required: true },
            { id: 'cargoType', originalLabel: 'Tipo de Carga', label: 'Tipo de Carga', placeholder: '', enabled: true, required: true },
            { id: 'weight', originalLabel: 'Peso Total (Kg)', label: 'Peso Total (Kg)', placeholder: 'Ex: 8500', enabled: true, required: true },
            { id: 'volumes', originalLabel: 'Volumes', label: 'Volumes', placeholder: 'Ex: 16', enabled: true, required: true },
            { id: 'vehicleType', originalLabel: 'Tipo de Veículo', label: 'Tipo de Veículo', placeholder: '', enabled: true, required: true },
            { id: 'bodyType', originalLabel: 'Carroceria', label: 'Carroceria', placeholder: '', enabled: true, required: true },
            { id: 'brand', originalLabel: 'Montadora / Marca do Veículo', label: 'Montadora / Marca do Veículo', placeholder: '', enabled: true, required: true },
            { id: 'value', originalLabel: 'Valor do Frete (R$)', label: 'Valor do Frete (R$)', placeholder: 'Ex: 1850.00', enabled: true, required: true },
            { id: 'paymentMethod', originalLabel: 'Forma de Pagamento', label: 'Forma de Pagamento', placeholder: '', enabled: true, required: true },
            { id: 'originCity', originalLabel: 'Cidade Origem', label: 'Cidade Origem', placeholder: 'Ex: São José do Rio Preto', enabled: true, required: true },
            { id: 'originState', originalLabel: 'UF Origem', label: 'UF Origem', placeholder: 'SP', enabled: true, required: true },
            { id: 'originAddress', originalLabel: 'Endereço Origem', label: 'Endereço Origem', placeholder: 'Av. Alberto Andaló', enabled: true, required: true },
            { id: 'originNumber', originalLabel: 'Número Origem', label: 'Número Origem', placeholder: 'Ex: 3100', enabled: true, required: true },
            { id: 'destCity', originalLabel: 'Cidade Destino', label: 'Cidade Destino', placeholder: 'Ex: São Paulo', enabled: true, required: true },
            { id: 'destState', originalLabel: 'UF Destino', label: 'UF Destino', placeholder: 'SP', enabled: true, required: true },
            { id: 'destAddress', originalLabel: 'Endereço Destino', label: 'Endereço Destino', placeholder: 'Av. Paulista', enabled: true, required: true },
            { id: 'destNumber', originalLabel: 'Número Destino', label: 'Número Destino', placeholder: 'Ex: 1000', enabled: true, required: true }
          ],
          driverForm: [
            { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Ex: João da Silva', enabled: true, required: true },
            { id: 'email', originalLabel: 'E-mail', label: 'E-mail', placeholder: 'joao@translog.com', enabled: true, required: true },
            { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(11) 98888-7777', enabled: true, required: true },
            { id: 'cpf', originalLabel: 'CPF', label: 'CPF', placeholder: '123.456.789-00', enabled: true, required: true },
            { id: 'rg', originalLabel: 'RG', label: 'RG', placeholder: '12.345.678-9', enabled: true, required: false },
            { id: 'city', originalLabel: 'Cidade', label: 'Cidade', placeholder: 'São Paulo', enabled: true, required: true },
            { id: 'state', originalLabel: 'Estado (UF)', label: 'Estado (UF)', placeholder: 'SP', enabled: true, required: true },
            { id: 'cnh', originalLabel: 'CNH', label: 'CNH', placeholder: 'Nº CNH', enabled: true, required: true },
            { id: 'cnhCategory', originalLabel: 'Categoria', label: 'Categoria', placeholder: '', enabled: true, required: true }
          ],
          expenseForm: [
            { id: 'driverName', originalLabel: 'Nome do Motorista', label: 'Nome do Motorista', placeholder: 'Nome...', enabled: true, required: true },
            { id: 'clientName', originalLabel: 'Cliente', label: 'Cliente', placeholder: 'Nome do Cliente...', enabled: true, required: true },
            { id: 'vehicleModel', originalLabel: 'Modelo do Veículo', label: 'Modelo do Veículo', placeholder: 'Ex: FH 540', enabled: true, required: true },
            { id: 'vehiclePlate', originalLabel: 'Placa do Caminhão / Veículo', label: 'Placa do Caminhão / Veículo', placeholder: 'ABC-1234', enabled: true, required: true },
            { id: 'chassis', originalLabel: 'Placa / Chassis', label: 'Placa / Chassis', placeholder: 'Nº Chassis', enabled: true, required: true },
            { id: 'startDate', originalLabel: 'Data de Início da Viagem', label: 'Data de Início da Viagem', placeholder: '', enabled: true, required: true },
            { id: 'endDate', originalLabel: 'Data de Término da Viagem', label: 'Data de Término da Viagem', placeholder: '', enabled: true, required: true },
            { id: 'initialKm', originalLabel: 'Km Inicial', label: 'Km Inicial', placeholder: '0', enabled: true, required: true },
            { id: 'finalKm', originalLabel: 'Km Final', label: 'Km Final', placeholder: '0', enabled: true, required: true }
          ]
        };
      }

      setConfig(saasData);
      setWaConfig(waData);
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao carregar configurações.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Sync waConfig state when API response changes
  useEffect(() => {
    if (!waConfig && loading === false) {
      // If waConfig is null after initial load, try to load it
      api.getWhatsAppConfig().then(data => setWaConfig(data)).catch(console.error);
    }
  }, [loading]);

  const handleSaveSaaSConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    if (isTestUser) {
      setMessage({ text: '⚠️ Contas e perfis criados para teste não possuem permissão para editar ou salvar informações do sistema.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateSaaSGlobalConfig(config);
      if (res.success) {
        setConfig(res.config);
        setMessage({ text: 'Configurações do SaaS salvas e aplicadas globalmente com sucesso!', type: 'success' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao salvar configurações do SaaS.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waConfig) return;

    if (isTestUser) {
      setMessage({ text: '⚠️ Contas e perfis criados para teste não possuem permissão para editar ou salvar informações do sistema.', type: 'error' });
      return;
    }

    setWaLocalSaving(true);
    setMessage(null);
    try {
      const res = await api.updateWhatsAppConfig(waConfig);
      if (res.success) {
        // Ensure waConfig stays in sync after save
        setWaConfig(res.config || waConfig);
        setMessage({ text: 'Configurações de integração com WhatsApp salvas com sucesso!', type: 'success' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao salvar configurações do WhatsApp.', type: 'error' });
    } finally {
      setWaLocalSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) {
      alert('Informe um celular válido para teste (formato: DDI + DDD + Número).');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testWhatsAppConnection({
        phone: testPhone,
        message: testMessage,
        baseUrl: waConfig?.baseUrl,
        token: waConfig?.token
      });
      setTestResult({
        success: res.success,
        message: res.message || 'Conexão testada com sucesso!'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro de comunicação com o Gateway.'
      });
    } finally {
      setTesting(false);
    }
  };

  const updatePlanField = (index: number, field: string, value: any) => {
    if (!config) return;
    const updatedPlans = [...config.plans];
    updatedPlans[index] = {
      ...updatedPlans[index],
      [field]: value
    };
    setConfig({
      ...config,
      plans: updatedPlans
    });
  };

  const updateNotificationModuleField = (field: keyof NonNullable<SaaSGlobalConfig['notificationModule']>, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      notificationModule: {
        ...DEFAULT_NOTIFICATION_MODULE,
        ...(config.notificationModule || {}),
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Carregando painel de parametrização SaaS...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Painel do Proprietário
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Versão {APP_VERSION} ({APP_BUILD_DATE})
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400 animate-pulse" /> Parametrização & Configurações SaaS
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Ambiente de alta segurança para gerenciamento de branding, limitação e preços dos planos corporativos, regras operacionais e integração com os canais de envio de códigos em tem...
          </p>
          <div className="text-[11px] font-mono text-emerald-400/90 pt-1">
            Build Ativo: {APP_RELEASE_NAME}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadAllConfigs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Recarregar Configurações"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div role="status" aria-live="polite" className={`fixed right-5 top-5 z-[100] max-w-sm p-4 rounded-2xl flex items-start gap-3 border shadow-2xl animate-in slide-in-from-right-4 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-semibold flex-1">{message.text}</div>
          <button type="button" onClick={() => setMessage(null)} className="text-xs font-black opacity-60 hover:opacity-100" aria-label="Fechar" />
        </div>
      )}

      {/* Grid Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sub-Menu */}
        <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 h-fit shadow-xs">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-3 px-3">Configuração SaaS</p>
          <p className="px-3 pt-1 pb-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">Prioridade e aquisição</p>
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'overview' ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          ><Search className="w-4 h-4 shrink-0" /> Visão geral SEO</button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'analytics' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          ><BarChart3 className="w-4 h-4 shrink-0" /> Visitas e origem</button>
          <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-indigo-600">Marca e comercial</p>
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'branding'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" /> Branding & Apresentação
          </button>
          
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'plans'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" /> Planos & Limites Corporativos
          </button>

          <button
            onClick={() => setActiveSubTab('asaas')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'asaas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" /> Pagamentos Asaas
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" /> Regras de Operação & Segurança
          </button>

          <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Operação e integrações</p>
          <button
            onClick={() => setActiveSubTab('gateway')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'gateway'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" /> Integração Gateway WhatsApp
          </button>

          <button
            onClick={() => setActiveSubTab('layout')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'layout'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" /> Layout & Design do Frontend
          </button>

          <button
            onClick={() => setActiveSubTab('fields')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'fields'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" /> Campos dos Formulários
          </button>
          
          <button
            onClick={() => setActiveSubTab('email')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'email'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" /> Configurações de E-mail
          </button>

          <button
            onClick={() => setActiveSubTab('seo')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'seo' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          ><Globe className="w-4 h-4 shrink-0" /> SEO Global</button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'notifications' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          ><MessageSquare className="w-4 h-4 shrink-0" /> Mensagens e Notificações</button>

          <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Comunicação e manutenção</p>
          <button
            onClick={() => setActiveSubTab('backups')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'backups' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          ><Database className="w-4 h-4 shrink-0" /> Monitor de Backups</button>

          <button
            onClick={() => setActiveSubTab('error-logs')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'error-logs' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          ><AlertTriangle className="w-4 h-4 shrink-0" /> Log de Erros</button>

          <button
            onClick={() => setActiveSubTab('sql-installation')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'sql-installation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" /> SQL & Instalação VPS
          </button>

          <button
            onClick={() => setActiveSubTab('mapbox')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'mapbox'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" /> Mapbox API & Rastreio
          </button>

          <button
            onClick={() => setActiveSubTab('help')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'help'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" /> Editor de Ajuda
          </button>
        </div>

        {/* Content Container */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          {/* Placeholder for content - The actual content would be here */}
          {activeSubTab === 'overview' && <AdminSeoOverviewPanel onOpenContentManagement={onOpenContentManagement} onOpenSeoConfig={() => setActiveSubTab('seo')} />}
          
          {/* TAB 9: MAPBOX API & RASTREIO */}
          {activeSubTab === 'mapbox' && config && (
            <MapboxConfigPanel
              config={config}
              onUpdateConfig={async (updated) => {
                const newConfig = { ...config, ...updated };
                setConfig(newConfig);
                await api.updateSaaSGlobalConfig(newConfig);
                setMessage({ text: 'Configurações do Mapbox salvas com sucesso!', type: 'success' });
                setTimeout(() => setMessage(null), 4000);
              }}
              saving={saving}
            />
          )}

          {/* TAB 4: WHATSAPP GATEWAY */}
          {activeSubTab === 'gateway' && waConfig && (
            <div className="space-y-6">
              <form onSubmit={handleSaveWhatsAppConfig} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Configuração de Disparos em Tempo Real</h3>
                      <p className="text-[11px] text-slate-400 mt-1">Conecte o sistema ao Atendo CRM para disparar códigos OTP corporativos e alertas.</p>
                    </div>
                    <button type="button" onClick={() => setShowWhatsAppTenantModal(true)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"><MessageSquare className="w-4 h-4" /> Gerenciar conexões por empresa</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Habilitar Gateway de Produção</p>
                      <p className="text-[10px] text-slate-400">Ativa o envio real de mensagens de texto via rede de telefonia/WhatsApp.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={waConfig.isActive}
                        onChange={e => setWaConfig({ ...waConfig, isActive: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Base URL do Gateway</label>
                      <input
                        type="url"
                        placeholder="Ex: https://api.z-api.io/v1/instances/SUA_INSTANCIA"
                        value={waConfig.baseUrl}
                        onChange={e => setWaConfig({ ...waConfig, baseUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Número do Canal Transmissor</label>
                      <input
                        type="text"
                        placeholder="Informe um número com DDI e DDD"
                        value={waConfig.defaultChannelNumber || ''}
                        onChange={e => setWaConfig({ ...waConfig, defaultChannelNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Token de Autorização / Client Secret</label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="Digite ou cole o Token de autenticação da sua instância API"
                          value={waConfig.token}
                          onChange={e => setWaConfig({ ...waConfig, token: e.target.value })}
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                        >
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Políticas de Alerta e Notificação</span>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waConfig.autoNotifyChecklist}
                        onChange={e => setWaConfig({ ...waConfig, autoNotifyChecklist: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Notificar o motorista automaticamente ao aprovar/reprovar um checklist</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waConfig.autoNotifyFreightStatus}
                        onChange={e => setWaConfig({ ...waConfig, autoNotifyFreightStatus: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Notificar alterações de status de fretes aceitos no celular do motorista</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={saving || waLocalSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {saving || waLocalSaving ? 'Gravando...' : 'Salvar Parâmetros do Gateway'}
                  </button>
                </div>
              </form>

              {/* Live Testing Box */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase">Disparar Envio de Teste</h4>
                  <p className="text-[10px] text-slate-400">Verifique a comunicação real com a API disparando um código de teste de segurança.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500">Destinatário (WhatsApp)</label>
                    <input
                      type="text"
                      placeholder="Informe um número com DDI e DDD"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">Corpo do Conteúdo</label>
                    <input
                      type="text"
                      value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                    />
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs font-semibold ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="font-bold flex items-center gap-1">
                      {testResult.success ? '✅ Envio Concluído!' : '❌ Erro de Transmissão'}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5">{testResult.message}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando API...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Disparar Mensagem de Teste Real
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <WhatsAppConfigModal
          isOpen={showWhatsAppTenantModal}
          onClose={() => setShowWhatsAppTenantModal(false)}
        />

      </div>

    </div>
  );
};
