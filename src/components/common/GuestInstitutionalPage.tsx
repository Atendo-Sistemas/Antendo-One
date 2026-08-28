import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Mail, Phone, Lock, User as UserIcon, Building2, FileText, Send, CheckCircle2, ArrowRight, AlertTriangle, MessageSquare, PlayCircle } from 'lucide-react';
import { api, setAuthToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { ThemeToggle } from './ThemeToggle';

import { TermsOfUse } from './TermsOfUse';
import { PrivacyPolicy } from './PrivacyPolicy';

interface GuestInstitutionalPageProps {
  onLoginSuccess: () => void;
  onDemoStart: (userId: string) => Promise<void>;
  initialTab?: 'inicio' | 'contato' | 'login' | 'cadastro';
}

const DEMO_PROFILES = [
  {
    id: 'user-demo-company-admin',
    label: 'Administradora da empresa',
    role: 'EMPRESA_SUPER_ADMIN',
    description: 'Visão geral do painel empresarial, indicadores, fretes, usuários e documentos.'
  },
  {
    id: 'user-demo-supervisor',
    label: 'Supervisor operacional',
    role: 'SUPERVISOR',
    description: 'Acompanhe a operação, fretes, motoristas, veículos e formulários em modo leitura.'
  },
  {
    id: 'user-demo-operator',
    label: 'Usuária operacional',
    role: 'USUARIO',
    description: 'Experimente a rotina de consulta e acompanhamento de cargas da equipe.'
  },
  {
    id: 'user-demo-driver',
    label: 'Motorista',
    role: 'MOTORISTA',
    description: 'Veja a perspectiva do motorista, seus fretes, veículo e checklist fictício.'
  }
] as const;

export const GuestInstitutionalPage: React.FC<GuestInstitutionalPageProps> = ({ onLoginSuccess, onDemoStart, initialTab = 'inicio' }) => {
  const { refreshProfile, refreshNotifications } = useAuth();
  const { config } = useSaaS();
  const [activeSubTab, setActiveSubTab] = useState<'inicio' | 'contato' | 'login' | 'cadastro'>(initialTab);

  // Terms and Privacy View
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [publicContent, setPublicContent] = useState<any[]>([]);

  // Dynamic layout / institutional home text config with fallbacks
  const logoName = config?.layout?.logoText || 'Elo Log';
  const homeBadge = config?.layout?.homeBadgeText || 'Solução Completa Multi-Tenant de Carga';
  const homeTitle = config?.layout?.homeTitle || 'Gestão e Publicação de Fretes em';
  const homeTitleAccent = config?.layout?.homeTitleAccent || 'Tempo Real';
  const homeSubtitle = config?.layout?.homeSubtitle || 'O Elo Log conecta transportadoras e motoristas com total isolamento e segurança. Publique fretes, controle frotas, execute checklists eletrônicos e audite sua operação logística em uma plataforma ágil e offline-ready.';

  useEffect(() => {
    const seo = config?.seo;
    if (!seo) return;
    document.title = seo.title || config?.layout?.browserTabTitle || logoName;
    let description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description); }
    description.content = seo.description || homeSubtitle;
  }, [config, homeSubtitle, logoName]);
  
  useEffect(() => {
    api.getPublicSeo().then(data => setPublicContent(data.content || [])).catch(() => undefined);
  }, []);
  // Login Form States
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginTimer, setLoginTimer] = useState(300); // 5 minutes in seconds
  const [loginTimerActive, setLoginTimerActive] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regResponsibleName, setRegResponsibleName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regPrivacyAccepted, setRegPrivacyAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regStep, setRegStep] = useState<'form' | 'verify' | 'success'>('form');
  const [regOtpCode, setRegOtpCode] = useState('');

  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);

  // Countdown timer effect for WhatsApp OTP
  useEffect(() => {
    let interval: any = null;
    if (loginTimerActive && loginTimer > 0) {
      interval = setInterval(() => {
        setLoginTimer(prev => prev - 1);
      }, 1000);
    } else if (loginTimer === 0) {
      setLoginTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [loginTimerActive, loginTimer]);

  const openDemoChooser = () => {
    if (demoLoading) return;
    setDemoError('');
    setShowDemoProfiles(true);
  };

  const handleStartDemo = async (userId: string) => {
    if (demoLoading) return;
    setDemoLoading(true);
    setDemoError('');
    try {
      await onDemoStart(userId);
      setShowDemoProfiles(false);
    } catch (err: any) {
      setDemoError(err?.message || 'Não foi possível iniciar a demonstração. Tente novamente.');
    } finally {
      setDemoLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format phone number dynamically (Brazilian format)
  const handlePhoneChange = (value: string, setter: (val: string) => void) => {
    const clean = value.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `(${clean.substring(0, 2)}) `;
      if (clean.length > 7) {
        formatted += `${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
      } else {
        formatted += clean.substring(2);
      }
    }
    setter(formatted);
  };

  // Format CNPJ dynamically
  const handleCnpjChange = (value: string) => {
    const clean = value.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}.${clean.substring(2)}`;
      if (clean.length > 5) {
        formatted = `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5)}`;
        if (clean.length > 8) {
          formatted = `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8)}`;
          if (clean.length > 12) {
            formatted = `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12, 14)}`;
          }
        }
      }
    }
    setRegCnpj(formatted);
  };

  // Login via Email and Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha o e-mail e a senha.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.login(loginEmail, undefined, loginPassword);
      setAuthToken(res.token);
      await refreshProfile();
      await refreshNotifications();
      onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Request Phone OTP via simulated WhatsApp
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone) {
      setLoginError('Digite o seu número de telefone.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      await api.requestOtp(loginPhone);
      setLoginOtpSent(true);
      setLoginTimer(300); // 5 minutes
      setLoginTimerActive(true);
    } catch (err: any) {
      setLoginError(err.message || 'Telefone não encontrado ou erro ao enviar código.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Confirm OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtpCode) {
      setLoginError('Insira o código de 6 dígitos enviado.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.verifyOtp(loginPhone, loginOtpCode);
      setAuthToken(res.token);
      await refreshProfile();
      await refreshNotifications();
      onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Código incorreto ou expirado.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Register Company Form Submit
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regCompanyName || !regCnpj || !regResponsibleName || !regEmail || !regPhone || !regPassword) {
      setRegError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não coincidem.');
      return;
    }

    if (!regTermsAccepted || !regPrivacyAccepted) {
      setRegError('Você deve aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    setRegLoading(true);

    try {
      await api.registerCompany({
        companyName: regCompanyName,
        cnpj: regCnpj,
        responsibleName: regResponsibleName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        termsAccepted: regTermsAccepted,
        privacyAccepted: regPrivacyAccepted
      });

      setRegStep('verify');
    } catch (err: any) {
      setRegError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setRegLoading(false);
    }
  };

  // Verify Registration OTP Code
  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regOtpCode) {
      setRegError('Digite o código de verificação recebido.');
      return;
    }

    setRegLoading(true);

    try {
      await api.verifyRegistration(regEmail, regOtpCode);
      setRegStep('success');
    } catch (err: any) {
      setRegError(err.message || 'Código de verificação inválido ou expirado.');
    } finally {
      setRegLoading(false);
    }
  };

  // Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      
      {/* Institutional Top Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  {logoName} <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">SaaS</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 block">
                  Logística Inteligente & Conectada
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('inicio')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === 'inicio'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Início
              </button>
              <a href="/vitrine-fretes" className="px-4 py-2 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">Fretes disponíveis</a>
              <button
                onClick={() => setActiveSubTab('contato')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === 'contato'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Contato
              </button>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
                <ThemeToggle />
              </div>

              <button
                onClick={() => {
                  setLoginOtpSent(false);
                  setLoginError('');
                  setActiveSubTab('login');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === 'login'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={openDemoChooser}
                disabled={demoLoading}
                className="px-4 py-2 rounded-lg text-sm font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
              >
                {demoLoading ? 'Abrindo demonstração...' : 'Demonstração'}
              </button>
              <button
                onClick={() => {
                  setRegStep('form');
                  setRegError('');
                  setActiveSubTab('cadastro');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors ${
                  activeSubTab === 'cadastro' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                }`}
              >
                Cadastrar Empresa
              </button>
            </div>

            {/* Mobile Actions Header */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={openDemoChooser}
                disabled={demoLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-60"
              >
                {demoLoading ? 'Abrindo...' : 'Demo'}
              </button>
              <button 
                onClick={() => setActiveSubTab('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800"
              >
                Entrar
              </button>
              <button 
                onClick={() => setActiveSubTab('cadastro')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showDemoProfiles && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="demo-profile-title" className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Demonstração pública</p>
                <h2 id="demo-profile-title" className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Escolha uma função para experimentar</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Todos os perfis usam dados fictícios da mesma empresa demo. Você poderá navegar e testar a experiência, mas nenhuma alteração será salva.</p>
              </div>
              <button type="button" onClick={() => setShowDemoProfiles(false)} disabled={demoLoading} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800" aria-label="Fechar escolha de perfil">Fechar</button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {DEMO_PROFILES.map(profile => (
                <button key={profile.id} type="button" onClick={() => void handleStartDemo(profile.id)} disabled={demoLoading} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{profile.label}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Perfil demo</span>
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{profile.description}</span>
                </button>
              ))}
            </div>

            {demoLoading && <p className="mt-4 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300">Preparando o perfil selecionado...</p>}
            {demoError && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">{demoError}</p>}
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setShowDemoProfiles(false)} disabled={demoLoading} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sections */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* TAB INICIO */}
        {activeSubTab === 'inicio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {homeBadge}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {homeTitle} <span className="text-emerald-600">{homeTitleAccent}</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                {homeSubtitle}
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex gap-3 items-start p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Controle de Tenants</h4>
                    <p className="text-xs text-slate-500">Dados individuais e blindados para cada transportadora.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Checklists de Trânsito</h4>
                    <p className="text-xs text-slate-500">Formulários eletrônicos para inspeções em tempo real.</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setActiveSubTab('cadastro')}
                  className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Cadastrar Minha Transportadora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={openDemoChooser}
                  disabled={demoLoading}
                  className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-base shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <PlayCircle className="w-5 h-5" />
                  {demoLoading ? 'Abrindo demonstração...' : 'Acessar demonstração'}
                </button>
                <button
                  onClick={() => setActiveSubTab('contato')}
                  className="px-6 py-3 rounded-xl font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-base flex items-center justify-center cursor-pointer"
                >
                  Falar com Comercial
                </button>
              </div>
              {demoError && <p className="mt-3 text-sm font-medium text-rose-600" role="alert">{demoError}</p>}
              <p className="mt-3 text-xs text-slate-500">A demonstração usa dados fictícios e não permite acessar configurações, credenciais ou pagamentos.</p>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-3xl rotate-3 blur-md opacity-10"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Truck className="text-emerald-600 w-5 h-5" />
                  Acesso Rápido ao Portal
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Se você já possui cadastro como transportadora ou motorista, acesse sua conta por email ou telefone.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setLoginMode('email');
                      setActiveSubTab('login');
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold flex items-center justify-between text-sm cursor-pointer"
                  >
                    <span>Entrar por E-mail</span>
                    <Mail className="w-4.5 h-4.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setLoginMode('phone');
                      setActiveSubTab('login');
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between text-sm cursor-pointer"
                  >
                    <span>Entrar com Telefone (WhatsApp OTP)</span>
                    <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                  </button>
                </div>

                <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
                  <span className="text-xs text-slate-500">Não possui conta? </span>
                  <button
                    onClick={() => setActiveSubTab('cadastro')}
                    className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Cadastre-se como Transportadora
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'inicio' && (
          <section className="mt-14 border-t border-slate-200 dark:border-slate-800 pt-12" aria-labelledby="planos-comerciais">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Planos comerciais</p>
              <h2 id="planos-comerciais" className="mt-2 text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Escolha a estrutura ideal para sua operação</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Planos transparentes para organizar fretes, equipes e notificações, com contratação do WhatsApp próprio quando sua empresa precisar.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {(config?.plans || []).filter(plan => plan.isActive).map(plan => (
                <div key={plan.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <h3 className="font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-400">R$ {Number(plan.price).toFixed(2).replace('.', ',')}<span className="text-xs font-semibold text-slate-500">/mês</span></p>
                  <p className="mt-3 text-sm text-slate-500">Até {plan.maxUsers} usuários, {plan.maxDrivers} motoristas e {plan.maxFreightsMonthly} fretes por mês.</p>
                </div>
              ))}
            </div>
            {config?.notificationModule?.enabled !== false && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-5">
                  <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-emerald-900 dark:text-emerald-200">{config?.notificationModule?.freePlanName || 'WhatsApp SaaS — Gratuito'}</h3><span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase text-white">Grátis</span></div>
                  <p className="mt-3 text-sm text-emerald-900/80 dark:text-emerald-200/80">{config?.notificationModule?.freePlanDescription || 'Notificações usando o telefone oficial da plataforma.'}</p>
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="w-4 h-4" /> Ativação inicial incluída</p>
                </div>
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20 p-5">
                  <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-indigo-900 dark:text-indigo-200">{config?.notificationModule?.ownNumberPlanName || 'WhatsApp Próprio da Empresa'}</h3><span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">R$ {Number(config?.notificationModule?.ownNumberMonthlyPrice ?? 89.90).toFixed(2).replace('.', ',')}<span className="text-xs font-semibold">/mês</span></span></div>
                  <p className="mt-3 text-sm text-indigo-900/80 dark:text-indigo-200/80">{config?.notificationModule?.ownNumberPlanDescription || 'Notificações usando o número e canal WhatsApp da empresa.'}</p>
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300"><CheckCircle2 className="w-4 h-4" /> Cobrança recorrente pelo Asaas</p>
                </div>
              </div>
            )}
            <p className="mt-4 text-center text-[11px] text-slate-500">A ativação assistida e os números adicionais podem ser contratados conforme a configuração comercial do SaaS. A disponibilidade depende da configuração do administrador.</p>
          </section>
        )}

        {/* TAB CONTATO */}
        {activeSubTab === 'inicio' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" aria-labelledby="conteudos-logisticos">
            <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Conteúdo e soluções Atendo One</p>
              <h2 id="conteudos-logisticos" className="mt-2 text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Organize a operação logística com informação e método</h2>
              <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">Guias práticos para transportadoras que querem publicar fretes com clareza, acompanhar viagens e melhorar seus registros operacionais.</p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {(publicContent.length ? publicContent : [
                  { slug: 'gestao-de-fretes-para-transportadoras', publicPath: 'conteudo', title: 'Gestão de fretes para transportadoras', excerpt: 'Como organizar publicação, negociação e acompanhamento de fretes.' },
                  { slug: 'sistema-de-gestao-de-transportes-tms', publicPath: 'conteudo', title: 'Sistema de gestão de transportes (TMS)', excerpt: 'Recursos essenciais para digitalizar a rotina logística.' },
                  { slug: 'checklist-de-viagem-para-transportadoras', publicPath: 'conteudo', title: 'Checklist de viagem para transportadoras', excerpt: 'Como registrar conferências, evidências e ocorrências.' }
                ]).filter((item: any) => !['politica-de-privacidade', 'termos-de-uso'].includes(item.slug)).slice(0, 6).map((item: any) => (
                  <a key={item.slug} href={`/${item.publicPath === 'elo-log' ? 'elo-log' : 'conteudo'}/${encodeURIComponent(item.slug)}`} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-emerald-400 hover:shadow-lg transition-all">
                    <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.excerpt || 'Conheça o conteúdo completo no portal Atendo One.'}</p>
                    <span className="mt-4 inline-block text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Ler conteúdo →</span>
                  </a>
                ))}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-900 p-5 text-white"><h3 className="font-extrabold">Publicação organizada</h3><p className="mt-2 text-sm text-slate-300">Centralize origem, destino, carga, prazos e condições antes de disponibilizar um frete.</p></div>
                <div className="rounded-2xl bg-emerald-700 p-5 text-white"><h3 className="font-extrabold">Visibilidade da viagem</h3><p className="mt-2 text-sm text-emerald-50">Acompanhe status, responsáveis e ocorrências em um fluxo claro para a equipe.</p></div>
                <div className="rounded-2xl bg-teal-700 p-5 text-white"><h3 className="font-extrabold">Dados para decidir</h3><p className="mt-2 text-sm text-teal-50">Mantenha históricos e registros úteis para suporte, auditoria e melhoria contínua.</p></div>
              </div>
              <div className="mt-10 max-w-4xl">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Dúvidas frequentes sobre gestão de fretes</h2>
                <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <details className="p-5"><summary className="cursor-pointer font-bold text-slate-900 dark:text-white">O que é gestão de fretes?</summary><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">É a organização das etapas de cadastro, publicação, aceite, acompanhamento e encerramento de uma oportunidade de transporte.</p></details>
                  <details className="p-5"><summary className="cursor-pointer font-bold text-slate-900 dark:text-white">Quem pode usar o Elo Log?</summary><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Transportadoras, equipes operacionais e motoristas podem usar os recursos conforme seus perfis e permissões.</p></details>
                  <details className="p-5"><summary className="cursor-pointer font-bold text-slate-900 dark:text-white">Como começar?</summary><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Cadastre a empresa, organize os usuários autorizados e comece com um fluxo padronizado de publicação e acompanhamento.</p></details>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSubTab === 'contato' && (
          <div className="max-w-xl mx-auto py-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Mail className="text-emerald-600 w-6 h-6" />
                Entre em Contato
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Fale com nossos especialistas em logística SaaS para tirar dúvidas ou solicitar suporte customizado.
              </p>

              {contactSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mensagem Enviada!</h3>
                  <p className="text-sm text-slate-500">
                    Agradecemos seu contato. Nossa equipe comercial responderá ao seu e-mail em até 24 horas.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm cursor-pointer"
                  >
                    Enviar Outra Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Seu Nome</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="Ex: joao@suatransportadora.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Mensagem</label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      placeholder="Como podemos te ajudar? (Ex: gostaria de solicitar uma demonstração comercial)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {contactLoading ? 'Enviando...' : 'Enviar Mensagem'}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB LOGIN */}
        {activeSubTab === 'login' && (
          <div className="max-w-md mx-auto py-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Acesse o Atendo One
              </h2>
              <p className="text-xs text-slate-500 text-center mb-6">
                Entre com segurança na sua operação logística
              </p>

              {/* Toggle Login Mode */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('email');
                    setLoginError('');
                    setLoginOtpSent(false);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loginMode === 'email'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  E-mail & Senha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('phone');
                    setLoginError('');
                    setLoginOtpSent(false);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loginMode === 'phone'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Celular (WhatsApp OTP)
                </button>
              </div>

              {loginError && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2 mb-4 leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Mode: Email */}
              {loginMode === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Seu E-mail</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="Ex: joao@transportadora.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Senha de Acesso</label>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
                  </button>
                </form>
              )}

              {/* Login Mode: Phone WhatsApp OTP */}
              {loginMode === 'phone' && (
                <div className="space-y-4">
                  {!loginOtpSent ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Número de Celular (WhatsApp)</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={loginPhone}
                            onChange={e => handlePhoneChange(e.target.value, setLoginPhone)}
                            placeholder="(17) 99999-9999"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Enviaremos um código OTP de uso único para validação segura via WhatsApp.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loginLoading ? 'Enviando...' : 'Receber Código no WhatsApp'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 leading-relaxed">
                        <span className="text-lg">💬</span>
                        <span>Código de segurança enviado via WhatsApp para o seu número. Verifique suas mensagens.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Código de Segurança</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={loginOtpCode}
                            onChange={e => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Digite o código de 6 dígitos"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-center font-mono tracking-widest focus:outline-emerald-500"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-slate-500">
                            Código expira em: <strong className="text-slate-700">{formatTime(loginTimer)}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginOtpSent(false);
                              setLoginOtpCode('');
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            Alterar Telefone
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {loginLoading ? 'Verificando...' : 'Confirmar Código e Entrar'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CADASTRO */}
        {activeSubTab === 'cadastro' && (
          <div className="max-w-xl mx-auto py-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Cadastre sua Empresa
              </h2>
              <p className="text-xs text-slate-500 text-center mb-6">
                Tenha dados isolados e gerencie sua operação logística de forma segura
              </p>

              {regError && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2 mb-5 leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* STEP 1: Registration Form */}
              {regStep === 'form' && (
                <>
                  {showTerms ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <TermsOfUse />
                        <button onClick={() => setShowTerms(false)} className="mt-4 w-full py-2 bg-slate-200 rounded-lg font-bold">Fechar</button>
                      </div>
                    </div>
                  ) : null}
                  {showPrivacy ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <PrivacyPolicy />
                        <button onClick={() => setShowPrivacy(false)} className="mt-4 w-full py-2 bg-slate-200 rounded-lg font-bold">Fechar</button>
                      </div>
                    </div>
                  ) : null}
                  <form onSubmit={handleRegisterCompany} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome Fantasia da Empresa *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regCompanyName}
                          onChange={e => setRegCompanyName(e.target.value)}
                          placeholder="Ex: TransLog Brasil"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">CNPJ da Empresa *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regCnpj}
                          onChange={e => handleCnpjChange(e.target.value)}
                          placeholder="00.000.000/0001-00"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-3">Dados do Responsável</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Responsável *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regResponsibleName}
                        onChange={e => setRegResponsibleName(e.target.value)}
                        placeholder="Ex: Carlos Alberto Ferreira"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail de Contato *</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="Ex: responsavel@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Celular (WhatsApp) *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={e => handlePhoneChange(e.target.value, setRegPhone)}
                          placeholder="(17) 99999-9999"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Senha de Acesso *</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirmação de Senha *</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          placeholder="Repita sua senha"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input 
                        type="checkbox" 
                        required
                        checked={regTermsAccepted} 
                        onChange={e => setRegTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Li e concordo com os <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-600 hover:underline font-bold">Termos de Uso</button></span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input 
                        type="checkbox" 
                        required
                        checked={regPrivacyAccepted} 
                        onChange={e => setRegPrivacyAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Li e concordo com a <button type="button" onClick={() => setShowPrivacy(true)} className="text-emerald-600 hover:underline font-bold">Política de Privacidade</button></span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {regLoading ? 'Processando Cadastro...' : 'Enviar Cadastro de Empresa'}
                    </button>
                  </div>
                </form>
                </>
              )}

              {/* STEP 2: Verification of registration */}
              {regStep === 'verify' && (
                <form onSubmit={handleVerifyRegistration} className="space-y-4">
                  <div className="text-center space-y-2 mb-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Enviamos um código de segurança de 6 dígitos para o e-mail <strong>{regEmail}</strong> e WhatsApp <strong>{regPhone}</strong> do responsável. Insira-o abaixo para confirmar o cadastro da sua empresa.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 text-center">Código de Verificação de Cadastro</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={regOtpCode}
                        onChange={e => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Digite o código de 6 dígitos"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-center font-mono tracking-widest focus:outline-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {regLoading ? 'Verificando...' : 'Confirmar e Concluir Verificação'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegStep('form')}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Voltar para o Formulário
                  </button>
                </form>
              )}

              {/* STEP 3: Verification Success & Pending Approval Display */}
              {regStep === 'success' && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-md">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Cadastro Verificado com Sucesso!</h3>
                    <p className="text-emerald-600 font-bold text-sm">✓ E-mail e WhatsApp confirmados.</p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                    Por motivos de segurança e para garantir o isolamento da arquitetura Multi-Tenant, <strong>sua conta foi registrada no estado pendente</strong>. 
                  </p>

                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-left max-w-md mx-auto text-amber-800 text-xs space-y-1.5 leading-relaxed">
                    <span className="font-bold block text-sm">⏳ Status: Aguardando Aprovação</span>
                    <span>Nossa equipe de Super Administradores foi notificada. Seu cadastro será revisado e liberado em breve. Você receberá um e-mail de confirmação assim que puder acessar a plataforma.</span>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setActiveSubTab('inicio')}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{config?.layout?.footerText || 'Elo Log • Gestão Logística Integrada © 2026'}</span>
          <span className="font-mono text-[10px] text-slate-400">
            Plataforma SaaS Segura • Conectividade Offline Garantida
          </span>
        </div>
      </footer>
    </div>
  );
};
