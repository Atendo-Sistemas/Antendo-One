import React, { useState, useEffect } from 'react';
import { Camera, MapPin, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const PermissionsRequestModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [geoPermission, setGeoPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [requestingGeo, setRequestingGeo] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      // Don't show if user previously dismissed this session or permanently granted
      const dismissed = localStorage.getItem('elolog_permissions_prompted');
      
      // Check Navigator Permissions API if supported
      if ('permissions' in navigator) {
        try {
          const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
          setGeoPermission(geoStatus.state as any);
          geoStatus.onchange = () => setGeoPermission(geoStatus.state as any);

          // Camera permission name is standard in modern browsers
          const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(camStatus.state as any);
          camStatus.onchange = () => setCameraPermission(camStatus.state as any);

          // If both are already granted, don't show modal
          if (geoStatus.state === 'granted' && camStatus.state === 'granted') {
            return;
          }
        } catch (e) {
          // Ignore if camera query is not supported in some browsers
        }
      }

      // If not dismissed yet, show modal on app start
      if (!dismissed) {
        // Small delay to let app render first
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    };

    checkPermissions();
  }, []);

  const handleRequestCamera = async () => {
    setRequestingCamera(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Seu navegador não suporta acesso direto à câmera.');
        setCameraPermission('denied');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop stream immediately after acquiring permission
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (err) {
      console.warn('Câmera negada ou indisponível:', err);
      setCameraPermission('denied');
    } finally {
      setRequestingCamera(false);
    }
  };

  const handleRequestGeo = () => {
    setRequestingGeo(true);
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização.');
      setGeoPermission('denied');
      setRequestingGeo(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPermission('granted');
        setRequestingGeo(false);
      },
      (err) => {
        console.warn('Geolocalização negada:', err);
        setGeoPermission('denied');
        setRequestingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRequestAll = async () => {
    await handleRequestCamera();
    handleRequestGeo();
  };

  const handleClose = () => {
    localStorage.setItem('elolog_permissions_prompted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const allGranted = cameraPermission === 'granted' && geoPermission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-snug">Permissões do Sistema</h3>
                <p className="text-xs text-emerald-100">Câmera e Localização (GPS)</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Para garantir a segurança do frete, validação de checklists com foto e rastreamento em tempo real, o <strong>Elo Log</strong> precisa de acesso à sua <strong>câmera</strong> e <strong>localização GPS</strong>.
          </p>

          <div className="space-y-3 pt-1">
            {/* Camera Item */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Acesso à Câmera</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Fotos de checklists e canhoto de frete</span>
                </div>
              </div>
              <div>
                {cameraPermission === 'granted' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativado
                  </span>
                ) : cameraPermission === 'denied' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" /> Negado
                  </span>
                ) : (
                  <button
                    onClick={handleRequestCamera}
                    disabled={requestingCamera}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {requestingCamera ? 'Solicitando...' : 'Permitir'}
                  </button>
                )}
              </div>
            </div>

            {/* Geolocation Item */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Localização (GPS)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Rastreamento da rota em trânsito</span>
                </div>
              </div>
              <div>
                {geoPermission === 'granted' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativado
                  </span>
                ) : geoPermission === 'denied' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" /> Negado
                  </span>
                ) : (
                  <button
                    onClick={handleRequestGeo}
                    disabled={requestingGeo}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {requestingGeo ? 'Solicitando...' : 'Permitir'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
            {!allGranted && (
              <button
                onClick={handleRequestAll}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Autorizar Câmera e GPS Agora
              </button>
            )}

            <button
              onClick={handleClose}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                allGranted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {allGranted ? 'Tudo Pronto! Acessar o Sistema' : 'Continuar sem autorizar agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
