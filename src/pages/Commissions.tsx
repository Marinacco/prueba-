import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { DollarSign, CheckCircle, Clock, Search, Filter, User, Briefcase, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAllCaseLawyers, useUpdateCaseLawyer } from '@/hooks/useSupabaseData';

const paymentLabels: Record<string, string> = { pending: 'Pendiente', paid: 'Pagada' };
const paymentStyles: Record<string, string> = { pending: 'badge-pending', paid: 'badge-active' };

export default function Commissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [liquidateId, setLiquidateId] = useState<string | null>(null);

  const { data: caseLawyers = [], isLoading } = useAllCaseLawyers();
  const updateCaseLawyer = useUpdateCaseLawyer();

  const commissionsData = (caseLawyers as any[]).filter((cl: any) => Number(cl.commission_amount) > 0);

  const filtered = commissionsData.filter((cl: any) => {
    const matchesSearch =
      cl.case?.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cl.lawyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cl.case?.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'paid' && cl.commission_paid) ||
      (statusFilter === 'pending' && !cl.commission_paid);
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const totalPending = commissionsData.filter((cl: any) => !cl.commission_paid).reduce((s: number, cl: any) => s + Number(cl.commission_amount), 0);
  const totalPaid = commissionsData.filter((cl: any) => cl.commission_paid).reduce((s: number, cl: any) => s + Number(cl.commission_amount), 0);
  const totalAll = commissionsData.reduce((s: number, cl: any) => s + Number(cl.commission_amount), 0);
  const paidCount = commissionsData.filter((cl: any) => cl.commission_paid).length;
  const pendingCount = commissionsData.filter((cl: any) => !cl.commission_paid).length;

  const liquidateItem = (caseLawyers as any[]).find((cl: any) => cl.id === liquidateId);

  // Progress percentage
  const progress = totalAll > 0 ? (totalPaid / totalAll) * 100 : 0;

  return (
    <MainLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Comisiones</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Registro y seguimiento de comisiones por profesional</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-3 mb-4 sm:mb-6">
        <div className="stat-card text-center">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 mb-2 mx-auto">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
          <p className="text-base sm:text-2xl font-bold text-foreground tabular-nums leading-tight">{formatCurrency(totalAll)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{commissionsData.length} registros</p>
        </div>
        <div className="stat-card text-center">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-success/10 mb-2 mx-auto">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Pagadas</p>
          <p className="text-base sm:text-2xl font-bold text-success tabular-nums leading-tight">{formatCurrency(totalPaid)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{paidCount} comisiones</p>
        </div>
        <div className="stat-card text-center bg-warning/5 border-warning/20">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-warning/10 mb-2 mx-auto">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Pendientes</p>
          <p className="text-base sm:text-2xl font-bold text-warning tabular-nums leading-tight">{formatCurrency(totalPending)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{pendingCount} comisiones</p>
        </div>
      </div>

      {/* Progress bar */}
      {totalAll > 0 && (
        <div className="stat-card mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-foreground">Progreso de Liquidación</span>
            <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 sm:h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--success)), hsl(var(--accent)))',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>{formatCurrency(totalPaid)} pagado</span>
            <span>{formatCurrency(totalPending)} pendiente</span>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por caso, profesional o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile cards - improved */}
      <div className="block lg:hidden space-y-3">
        {isLoading ? (
          <div className="stat-card text-center py-8 text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="stat-card text-center py-8 text-muted-foreground">No hay comisiones registradas.</div>
        ) : (
          filtered.map((cl: any) => (
            <div key={cl.id} className={cn(
              'stat-card overflow-hidden',
              !cl.commission_paid && 'border-l-4 border-l-warning',
              cl.commission_paid && 'border-l-4 border-l-success',
            )}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-xs font-bold',
                    cl.commission_paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  )}>
                    {cl.lawyer?.name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cl.lawyer?.name || '—'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{cl.case?.client?.name || '—'}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0', cl.commission_paid ? paymentStyles.paid : paymentStyles.pending)}>
                  {cl.commission_paid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {cl.commission_paid ? 'Pagada' : 'Pendiente'}
                </span>
              </div>

              {/* Details */}
              <div className="bg-muted/30 rounded-lg p-2.5 mb-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" />{cl.case?.case_number || '—'}</span>
                  <span className="text-foreground font-medium">{cl.case?.service?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Caso: </span>
                    <span className="font-medium text-foreground tabular-nums">{formatCurrency(Number(cl.case?.total_amount || 0))}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">{cl.commission_type === 'percentage' ? `${cl.commission_percentage}%` : 'Fijo'} → </span>
                    <span className="font-bold text-accent tabular-nums text-sm">{formatCurrency(Number(cl.commission_amount))}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              {!cl.commission_paid && (
                <Button size="sm" className="btn-gold w-full text-xs h-8" onClick={() => setLiquidateId(cl.id)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Marcar como Pagada
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block stat-card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay comisiones registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-3.5 text-left">Profesional</th>
                  <th className="px-5 py-3.5 text-left">Caso</th>
                  <th className="px-5 py-3.5 text-left">Cliente</th>
                  <th className="px-5 py-3.5 text-left">Servicio</th>
                  <th className="px-5 py-3.5 text-right">Monto Caso</th>
                  <th className="px-5 py-3.5 text-center">Tipo</th>
                  <th className="px-5 py-3.5 text-right">Comisión</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((cl: any) => (
                  <tr key={cl.id} className={cn(
                    'transition-colors',
                    !cl.commission_paid ? 'hover:bg-warning/5' : 'hover:bg-muted/30',
                  )}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0',
                          cl.commission_paid ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                        )}>
                          {cl.lawyer?.name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-foreground">{cl.lawyer?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-foreground">{cl.case?.case_number || '—'}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-foreground">{cl.case?.client?.name || '—'}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-foreground">{cl.case?.service?.name || '—'}</span></td>
                    <td className="px-5 py-3.5 text-right"><span className="text-sm tabular-nums text-foreground">{formatCurrency(Number(cl.case?.total_amount || 0))}</span></td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                        {cl.commission_type === 'percentage' ? `${cl.commission_percentage}%` : 'Fijo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right"><span className="font-bold text-accent tabular-nums">{formatCurrency(Number(cl.commission_amount))}</span></td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', cl.commission_paid ? paymentStyles.paid : paymentStyles.pending)}>
                        {cl.commission_paid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {cl.commission_paid ? paymentLabels.paid : paymentLabels.pending}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {!cl.commission_paid ? (
                        <Button size="sm" className="h-7 text-xs btn-gold" onClick={() => setLiquidateId(cl.id)}>Liquidar</Button>
                      ) : (
                        <CheckCircle className="h-5 w-5 text-success mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-4"><p className="text-xs sm:text-sm text-muted-foreground">Mostrando {filtered.length} de {commissionsData.length} comisiones</p></div>

      <ConfirmDialog
        open={!!liquidateId}
        onOpenChange={(o) => !o && setLiquidateId(null)}
        title="Liquidar Comisión"
        description={`¿Confirmas la liquidación de ${formatCurrency(Number(liquidateItem?.commission_amount ?? 0))} para ${liquidateItem?.lawyer?.name}?`}
        confirmLabel="Liquidar"
        onConfirm={() => { updateCaseLawyer.mutate({ id: liquidateId!, commission_paid: true }); setLiquidateId(null); }}
      />
    </MainLayout>
  );
}
