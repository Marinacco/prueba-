import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateCase, useLawyers, useServices, useClients, useCreateCaseLawyer, useDeleteCaseLawyer } from '@/hooks/useSupabaseData';
import { Plus, Trash2 } from 'lucide-react';

interface LawyerAssignment {
  id?: string; // existing case_lawyer id
  lawyerId: string;
  commissionType: string;
  commissionPercentage: string;
  commissionAmount: string;
}

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: any;
}

export function EditCaseDialog({ open, onOpenChange, caseItem }: EditCaseDialogProps) {
  const [form, setForm] = useState({
    status: '', totalAmount: '', notes: '',
    paymentStatus: '', priority: '', clientId: '', serviceId: '', startDate: '',
  });
  const [lawyerAssignments, setLawyerAssignments] = useState<LawyerAssignment[]>([]);

  const updateCase = useUpdateCase();
  const createCaseLawyer = useCreateCaseLawyer();
  const deleteCaseLawyer = useDeleteCaseLawyer();
  const { data: lawyers = [] } = useLawyers();
  const { data: services = [] } = useServices();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (caseItem) {
      setForm({
        status: caseItem.status || 'active',
        totalAmount: String(caseItem.total_amount || ''),
        notes: caseItem.notes || '',
        paymentStatus: caseItem.payment_status || 'pending',
        priority: caseItem.priority || 'medium',
        clientId: caseItem.client_id || '',
        serviceId: caseItem.service_id || '',
        startDate: caseItem.start_date || '',
      });

      // Load existing case_lawyers
      const cls = caseItem.case_lawyers || [];
      if (cls.length > 0) {
        setLawyerAssignments(cls.map((cl: any) => ({
          id: cl.id,
          lawyerId: cl.lawyer_id,
          commissionType: cl.commission_type || 'percentage',
          commissionPercentage: String(cl.commission_percentage || 0),
          commissionAmount: String(cl.commission_amount || 0),
        })));
      } else {
        // Legacy: single lawyer
        setLawyerAssignments(caseItem.lawyer_id ? [{
          lawyerId: caseItem.lawyer_id,
          commissionType: 'percentage',
          commissionPercentage: '0',
          commissionAmount: String(caseItem.commission_amount || 0),
        }] : [{ lawyerId: '', commissionType: 'percentage', commissionPercentage: '', commissionAmount: '' }]);
      }
    }
  }, [caseItem]);

  const totalAmount = Number(form.totalAmount) || 0;
  const totalCommissions = lawyerAssignments.reduce((s, a) => s + (Number(a.commissionAmount) || 0), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const updateAssignment = (index: number, updates: Partial<LawyerAssignment>) => {
    const updated = [...lawyerAssignments];
    updated[index] = { ...updated[index], ...updates };
    if ((updates.commissionPercentage !== undefined || updates.commissionType !== undefined) && updated[index].commissionType === 'percentage') {
      updated[index].commissionAmount = String(totalAmount * (Number(updated[index].commissionPercentage) || 0) / 100);
    }
    setLawyerAssignments(updated);
  };

  const addLawyer = () => {
    setLawyerAssignments([...lawyerAssignments, { lawyerId: '', commissionType: 'percentage', commissionPercentage: '', commissionAmount: '' }]);
  };

  const removeLawyer = (index: number) => {
    const a = lawyerAssignments[index];
    if (a.id) {
      deleteCaseLawyer.mutate(a.id);
    }
    setLawyerAssignments(lawyerAssignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await updateCase.mutateAsync({
      id: caseItem.id,
      status: form.status,
      total_amount: totalAmount,
      commission_amount: totalCommissions,
      notes: form.notes || null,
      payment_status: form.paymentStatus,
      priority: form.priority,
      client_id: form.clientId || null,
      service_id: form.serviceId || null,
      start_date: form.startDate || undefined,
    });

    // Sync case_lawyers: delete removed, add new
    const existingIds = (caseItem.case_lawyers || []).map((cl: any) => cl.id);
    const currentIds = lawyerAssignments.filter(a => a.id).map(a => a.id);
    
    // Delete removed
    for (const eid of existingIds) {
      if (!currentIds.includes(eid)) {
        await deleteCaseLawyer.mutateAsync(eid);
      }
    }

    // Add/update
    for (const a of lawyerAssignments) {
      if (!a.lawyerId) continue;
      if (!a.id) {
        await createCaseLawyer.mutateAsync({
          case_id: caseItem.id,
          lawyer_id: a.lawyerId,
          commission_type: a.commissionType,
          commission_percentage: Number(a.commissionPercentage) || 0,
          commission_amount: Number(a.commissionAmount) || 0,
        });
      }
    }

    onOpenChange(false);
  };

  const assignedIds = lawyerAssignments.map(a => a.lawyerId).filter(Boolean);
  const activeLawyers = (lawyers as any[]).filter((l: any) => l.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Editar Caso {caseItem?.case_number}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {(clients as any[]).map((cl: any) => (
                    <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Select value={form.serviceId} onValueChange={(v) => {
                const svc = (services as any[]).find((s: any) => s.id === v);
                setForm({ ...form, serviceId: v, totalAmount: svc ? String(svc.base_price) : form.totalAmount });
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {(services as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} - {formatCurrency(s.base_price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monto Total (USD) *</Label>
            <Input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </div>

          {/* Multiple Lawyer Assignments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Profesionales Asignados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLawyer} className="gap-1">
                <Plus className="h-3 w-3" /> Agregar
              </Button>
            </div>
            {lawyerAssignments.map((a, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Profesional {i + 1}</span>
                  {lawyerAssignments.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLawyer(i)} className="h-7 w-7 p-0 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Select value={a.lawyerId} onValueChange={(v) => updateAssignment(i, { lawyerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar profesional" /></SelectTrigger>
                  <SelectContent>
                    {activeLawyers.filter((l: any) => !assignedIds.includes(l.id) || l.id === a.lawyerId).map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={a.commissionType} onValueChange={(v) => updateAssignment(i, { commissionType: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                      <SelectItem value="fixed">Monto Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                  {a.commissionType === 'percentage' ? (
                    <Input type="number" placeholder="%" value={a.commissionPercentage} onChange={(e) => updateAssignment(i, { commissionPercentage: e.target.value, commissionAmount: String(totalAmount * (Number(e.target.value) || 0) / 100) })} className="text-sm" />
                  ) : (
                    <Input type="number" placeholder="$0" value={a.commissionAmount} onChange={(e) => updateAssignment(i, { commissionAmount: e.target.value })} className="text-sm" />
                  )}
                  <div className="flex items-center justify-end text-sm font-semibold text-accent tabular-nums">
                    {formatCurrency(Number(a.commissionAmount) || 0)}
                  </div>
                </div>
              </div>
            ))}
            {totalAmount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Total Comisiones:</span>
                <span className="font-bold text-accent tabular-nums">{formatCurrency(totalCommissions)}</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Estado del Caso</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado de Pago</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha de Inicio</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Notas del Caso</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalles adicionales del caso..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="btn-gold" onClick={handleSubmit} disabled={updateCase.isPending}>
            {updateCase.isPending ? 'Guardando...' : 'Actualizar Caso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
