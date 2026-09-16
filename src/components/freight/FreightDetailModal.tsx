import React, { useMemo, useState } from 'react';
import { api } from '../../services/api';
import { Freight, FreightStatus } from '../../types';
import { Calendar, DollarSign, Link2, MapPin, Package, Pencil, Radio, RefreshCw, Trash2, Truck, X } from 'lucide-react';
import { LiveRouteTrackingModal } from '../tracking/LiveRouteTrackingModal';

interface FreightDetailModalProps {
  freight: Freight;
  onClose: () => void;
  onUpdateSuccess?: (freight: Freight) => void;
  onDeleteSuccess?: (id: string) => void;
  onEdit?: (freight: Freight) => void;
  isAdmin?: boolean;
}

const STATUS_LABELS: Record<FreightStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  EM_COLETA: 'Em coleta',
  COLETADO: 'Coletado',
  EM_TRANSITO: 'Em trânsito',
  ENTREGUE: 'Entregue',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado'
};

const STATUS_TRANSITIONS: Record<FreightStatus, FreightStatus[]> = {
  RASCUNHO: ['PUBLICADO', 'CANCELADO'],
  PUBLICADO: ['DISPONIVEL', 'RESERVADO', 'CANCELADO'],
  DISPONIVEL: ['RESERVADO', 'CANCELADO'],
  RESERVADO: ['EM_COLETA', 'DISPONIVEL', 'CANCELADO'],
  EM_COLETA: ['COLETADO', 'CANCELADO'],
  COLETADO: ['EM_TRANSITO', 'CANCELADO'],
  EM_TRANSITO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: []
};

const formatCurrency = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR');
};

const formatAddress = (location: Freight['origin']) =>
  [location.address, location.number, location.city, location.state].filter(Boolean).join(', ');

export const FreightDetailModal: React.FC<FreightDetailModalProps> = ({
  freight,
  onClose,
  onUpdateSuccess,
  onDeleteSuccess,
  onEdit,
  isAdmin = false
}) => {
  const [currentFreight, setCurrentFreight] = useState(freight);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  React.useEffect(() => {
    setCurrentFreight(freight);
  }, [freight]);

  const nextStatuses = useMemo(() => STATUS_TRANSITIONS[currentFreight.status] || [], [currentFreight.status]);
  const trackingEnabled = currentFreight.publicTrackingEnabled !== false && !currentFreight.publicTrackingRevokedAt;

  const handleStatusChange = async (newStatus: FreightStatus) => {
    setPendingAction(`status:${newStatus}`);
    setError(null);
    try {
      const updated = await api.updateFreightStatus(currentFreight.id, newStatus);
      setCurrentFreight(updated);
      onUpdateSuccess?.(updated);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível atualizar o status do frete.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir definitivamente o frete ${currentFreight.code}? Esta ação removerá o frete e os dados operacionais relacionados.`)) return;
    setPendingAction('delete');
    setError(null);
    try {
      await api.deleteFreight(currentFreight.id);
      onDeleteSuccess?.(currentFreight.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível cancelar o frete.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleTrackingToggle = async () => {
    setPendingAction('tracking');
    setError(null);
    try {
      const revoked = trackingEnabled;
      await api.setPublicTrackingRevoked(currentFreight.id, revoked);
      const updatedFreight = {
        ...currentFreight,
        publicTrackingEnabled: !revoked,
        publicTrackingRevokedAt: revoked ? new Date().toISOString() : undefined
      };
      setCurrentFreight(updatedFreight);
      onUpdateSuccess?.(updatedFreight);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível atualizar o link público de rastreio.');
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {STATUS_LABELS[currentFreight.status]}
                </span>
                <span className="text-xs font-mono text-slate-500">#{currentFreight.code}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{currentFreight.cargo.description}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentFreight.tenantName || 'Empresa'} • {currentFreight.operationType || 'CARGA_GERAL'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <MapPin className="h-4 w-4 text-emerald-600" /> Origem e destino
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Origem</p>
                  <p className="text-slate-800 dark:text-slate-200">{formatAddress(currentFreight.origin)}</p>
                  <p className="text-xs text-slate-500">{currentFreight.origin.date} • {currentFreight.origin.timeWindow || 'Horário livre'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Destino</p>
                  <p className="text-slate-800 dark:text-slate-200">{formatAddress(currentFreight.destination)}</p>
                  <p className="text-xs text-slate-500">{currentFreight.destination.date} • {currentFreight.destination.timeWindow || 'Horário livre'}</p>
                </div>
                <p className="text-xs text-slate-500">Distância estimada: {currentFreight.distanceKm || 0} km</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Package className="h-4 w-4 text-emerald-600" /> Carga e exigências
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tipo de carga</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentFreight.cargo.type}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Peso / volumes</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentFreight.cargo.weightKg} kg • {currentFreight.cargo.volumeCount} volumes</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Veículo exigido</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentFreight.requirements.vehicleType}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Carroceria / capacidade</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentFreight.requirements.bodyTypeRequired || '—'} • {currentFreight.requirements.minCapacityKg} kg</p>
                </div>
                {currentFreight.cargo.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Observações</p>
                    <p className="text-slate-800 dark:text-slate-200">{currentFreight.cargo.notes}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Pagamento
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Valor do frete</p>
                  <p className="text-slate-800 dark:text-slate-200">{formatCurrency(currentFreight.payment.price)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pagamento</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentFreight.payment.paymentMethod}</p>
                </div>
                {typeof currentFreight.payment.clientRevenue === 'number' && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receita cliente</p>
                    <p className="text-slate-800 dark:text-slate-200">{formatCurrency(currentFreight.payment.clientRevenue)}</p>
                  </div>
                )}
                {typeof currentFreight.payment.driverCost === 'number' && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Repasse motorista</p>
                    <p className="text-slate-800 dark:text-slate-200">{formatCurrency(currentFreight.payment.driverCost)}</p>
                  </div>
                )}
                {currentFreight.payment.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Observações financeiras</p>
                    <p className="text-slate-800 dark:text-slate-200">{currentFreight.payment.notes}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Truck className="h-4 w-4 text-emerald-600" /> Operação e rastreio
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Motorista</p>
                    <p className="text-slate-800 dark:text-slate-200">{currentFreight.assignedDriverName || 'Não atribuído'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Veículo</p>
                    <p className="text-slate-800 dark:text-slate-200">{currentFreight.assignedVehiclePlate || currentFreight.assignedVehicleModel || 'Não atribuído'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Última posição</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {currentFreight.currentLocation
                      ? `${currentFreight.currentLocation.lat.toFixed(5)}, ${currentFreight.currentLocation.lng.toFixed(5)}`
                      : 'Sem posição GPS registrada'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {currentFreight.currentLocation ? formatDateTime(currentFreight.currentLocation.recordedAt) : '—'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Link público</p>
                    <p className="text-slate-800 dark:text-slate-200">{trackingEnabled ? 'Ativo' : 'Bloqueado'}</p>
                  </div>
                  {currentFreight.requestedBudgetId && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Orçamento vinculado</p>
                      <p className="text-slate-800 dark:text-slate-200">{currentFreight.requestedBudgetId}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Calendar className="h-4 w-4 text-emerald-600" /> Histórico
            </h3>
            <div className="space-y-3">
              {currentFreight.statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma movimentação registrada.</p>
              ) : (
                currentFreight.statusHistory
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{STATUS_LABELS[entry.status]}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(entry.timestamp)}</p>
                      </div>
                      <p className="text-xs text-slate-500">{entry.changedByName}</p>
                      {entry.notes && <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{entry.notes}</p>}
                    </div>
                  ))
              )}
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsTrackingOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                <Radio className="h-4 w-4" /> Acompanhar rastreio
              </button>
              {isAdmin && onEdit && currentFreight.status !== 'CANCELADO' && (
                <button
                  type="button"
                  onClick={() => onEdit(currentFreight)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Pencil className="h-4 w-4" /> Editar frete
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleTrackingToggle}
                  disabled={pendingAction === 'tracking'}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {pendingAction === 'tracking' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  {trackingEnabled ? 'Bloquear link público' : 'Reativar link público'}
                </button>
              )}
              {isAdmin && currentFreight.status !== 'CANCELADO' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pendingAction === 'delete'}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {pendingAction === 'delete' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Cancelar frete
                </button>
              )}
            </div>

            {isAdmin && nextStatuses.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Próximos status</p>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      disabled={pendingAction === `status:${status}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {pendingAction === `status:${status}` ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isTrackingOpen && (
        <LiveRouteTrackingModal
          freight={currentFreight}
          onClose={() => setIsTrackingOpen(false)}
        />
      )}
    </>
  );
};
