import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Plus, Search, Filter, Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NewCaseDialog } from '@/components/dialogs/NewCaseDialog';
import { EditCaseDialog } from '@/components/dialogs/EditCaseDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useCases, useDeleteCase } from '@/hooks/useSupabaseData';

const statusLabels: Record<string, string> = { active: 'Activo', in_progress: 'En Proceso', completed: 'Finalizado', cancelled: 'Cancelado' };
const statusStyles: Record<string, string> = { active: 'badge-active', in_progress: 'badge-pending', completed: 'bg-primary/10 text-primary border border-primary/20', cancelled: 'badge-inactive' };
const paymentLabels: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial' };
const paymentStyles: Record<string, string> = { pending: 'badge-pending', paid: 'badge-active', partial: 'bg-accent/10 text-accent border border-accent/20' };
const priorityLabels: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
const priorityStyles: Record<string, string> = { low: 'text-muted-foreground', medium: 'text-foreground', high: 'text-warning', critical: 'text-destructive font-semibold' };

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [editCase, setEditCase] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: cases = [], isLoading } = useCases();
  const deleteMutation = useDeleteCase();

  const filteredCases = (cases as any[]).filter((c: any) => {
    const lawyerNames = (c.case_lawyers || []).map((cl: any) => cl.lawyer?.name || '').join(' ');
    const matchesSearch = c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) || c.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || lawyerNames.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getLawyerNames = (c: any) => {
    const cls = c.case_lawyers || [];
    if (cls.length > 0) return cls.map((cl: any) => cl.lawyer?.name).filter(Boolean).join(', ');
    return c.lawyer?.name || '—';
  };

  const getTotalCommission = (c: any) => {
    const cls = c.case_lawyers || [];
    if (cls.length > 0) return cls.reduce((s: number, cl: any) => s + Number(cl.commission_amount || 0), 0);
    return Number(c.commission_amount || 0);
  };

  const deleteCaseItem = (cases as any[]).find((c: any) => c.id === deleteId);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Casos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control y seguimiento de casos legales</p>
        </div>
        <Button className="btn-gold rounded-lg px-4 py-2 w-full sm:w-auto" onClick={() => setNewCaseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Nuevo Caso
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por caso, cliente o profesional..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="in_progress">En Proceso</SelectItem>
              <SelectItem value="completed">Finalizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile: Card view */}
      <div className="block lg:hidden space-y-4">
        {isLoading ? (
          <div className="stat-card text-center py-8 text-muted-foreground">Cargando casos...</div>
        ) : filteredCases.length === 0 ? (
          <div className="stat-card text-center py-8 text-muted-foreground">No hay casos registrados.</div>
        ) : (
          filteredCases.map((c: any) => (
            <div key={c.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-mono text-sm font-semibold text-foreground">{c.case_number}</span>
                  <p className="text-sm text-foreground mt-1">{c.client?.name || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[c.status] || '')}>
                    {statusLabels[c.status] || c.status}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => setEditCase(c)}><Edit2 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Servicio:</span> <span className="text-foreground">{c.service?.name || '—'}</span></div>
                <div><span className="text-muted-foreground">Profesionales:</span> <span className="text-foreground">{getLawyerNames(c)}</span></div>
                <div><span className="text-muted-foreground">Monto:</span> <span className="font-semibold text-foreground tabular-nums">{formatCurrency(Number(c.total_amount))}</span></div>
                <div><span className="text-muted-foreground">Comisiones:</span> <span className="font-semibold text-accent tabular-nums">{formatCurrency(getTotalCommission(c))}</span></div>
                <div><span className="text-muted-foreground">Pago:</span> <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', paymentStyles[c.payment_status] || 'badge-pending')}>{paymentLabels[c.payment_status] || 'Pendiente'}</span></div>
                <div><span className="text-muted-foreground">Prioridad:</span> <span className={cn('text-sm font-medium', priorityStyles[c.priority] || '')}>{priorityLabels[c.priority] || 'Media'}</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden lg:block stat-card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando casos...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay casos registrados. Crea el primero.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4 text-left">Caso</th>
                  <th className="px-6 py-4 text-left">Cliente</th>
                  <th className="px-6 py-4 text-left">Servicio</th>
                  <th className="px-6 py-4 text-left">Profesionales</th>
                  <th className="px-6 py-4 text-left">Fecha Inicio</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-right">Comisiones</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Pago</th>
                  <th className="px-6 py-4 text-center">Prioridad</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCases.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4"><span className="font-mono text-sm font-semibold text-foreground">{c.case_number}</span></td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{c.client?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{c.client?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{c.service?.name || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {(c.case_lawyers || []).length > 0 ? (c.case_lawyers as any[]).map((cl: any, i: number) => (
                          <p key={i} className="text-sm text-foreground">{cl.lawyer?.name || '—'} <span className="text-xs text-accent tabular-nums">({formatCurrency(Number(cl.commission_amount || 0))})</span></p>
                        )) : <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-muted-foreground tabular-nums">{c.start_date || '—'}</span></td>
                    <td className="px-6 py-4 text-right"><span className="font-semibold text-foreground tabular-nums">{formatCurrency(Number(c.total_amount))}</span></td>
                    <td className="px-6 py-4 text-right"><span className="font-semibold text-accent tabular-nums">{formatCurrency(getTotalCommission(c))}</span></td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[c.status] || '')}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', paymentStyles[c.payment_status] || 'badge-pending')}>
                        {paymentLabels[c.payment_status] || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn('text-sm font-medium', priorityStyles[c.priority] || '')}>
                        {priorityLabels[c.priority] || 'Media'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-muted transition-colors"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => setEditCase(c)}><Edit2 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4"><p className="text-sm text-muted-foreground">Mostrando {filteredCases.length} de {(cases as any[]).length} casos</p></div>

      <NewCaseDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
      <EditCaseDialog open={!!editCase} onOpenChange={(o) => !o && setEditCase(null)} caseItem={editCase} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar Caso"
        description={`¿Estás seguro de eliminar el caso ${deleteCaseItem?.case_number}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(deleteId!); setDeleteId(null); }}
      />
    </MainLayout>
  );
}
