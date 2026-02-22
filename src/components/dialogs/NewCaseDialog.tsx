import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLawyers, useServices, useCreateClient, useCreateCase, useCreateCaseLawyer } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LawyerAssignment {
  lawyerId: string;
  commissionType: string;
  commissionPercentage: string;
  commissionAmount: string;
}

interface NewCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewCaseDialog({ open, onOpenChange }: NewCaseDialogProps) {
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', serviceId: '', totalAmount: '', notes: '' });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [lawyerAssignments, setLawyerAssignments] = useState<LawyerAssignment[]>([
    { lawyerId: '', commissionType: 'percentage', commissionPercentage: '', commissionAmount: '' },
  ]);

  const { data: lawyers = [] } = useLawyers();
  const { data: services = [] } = useServices();
  const createClient = useCreateClient();
  const createCase = useCreateCase();
  const createCaseLawyer = useCreateCaseLawyer();

  const totalAmount = Number(form.totalAmount) || 0;

  const updateAssignment = (index: number, updates: Partial<LawyerAssignment>) => {
    const updated = [...lawyerAssignments];
    updated[index] = { ...updated[index], ...updates };

    // Recalculate commission amount if type is percentage
    if (updates.commissionPercentage !== undefined || updates.commissionType !== undefined) {
      const a = updated[index];
      if (a.commissionType === 'percentage') {
        a.commissionAmount = String(totalAmount * (Number(a.commissionPercentage) || 0) / 100);
      }
    }
    setLawyerAssignments(updated);
  };

  const addLawyer = () => {
    setLawyerAssignments([...lawyerAssignments, { lawyerId: '', commissionType: 'percentage', commissionPercentage: '', commissionAmount: '' }]);
  };

  const removeLawyer = (index: number) => {
    if (lawyerAssignments.length > 1) {
      setLawyerAssignments(lawyerAssignments.filter((_, i) => i !== index));
    }
  };

  const totalCommissions = lawyerAssignments.reduce((s, a) => s + (Number(a.commissionAmount) || 0), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const handleSubmit = async () => {
    if (!form.clientName || !form.serviceId || !lawyerAssignments.some(a => a.lawyerId)) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      const client = await createClient.mutateAsync({ name: form.clientName, email: form.clientEmail || undefined, phone: form.clientPhone || undefined });
      // Generate sequential case number: YYYY-XXXX
      const year = new Date().getFullYear();
      const { data: existingCases } = await (await import('@/integrations/supabase/client')).supabase
        .from('cases')
        .select('case_number')
        .like('case_number', `${year}-%`)
        .order('case_number', { ascending: false })
        .limit(1);
      let nextNum = 1;
      if (existingCases && existingCases.length > 0) {
        const lastNum = parseInt(existingCases[0].case_number.split('-')[1] || '0', 10);
        nextNum = lastNum + 1;
      }
      const caseNumber = `${year}-${String(nextNum).padStart(4, '0')}`;

      const newCase = await createCase.mutateAsync({
        case_number: caseNumber,
        client_id: client.id,
        service_id: form.serviceId,
        total_amount: totalAmount,
        commission_amount: totalCommissions,
        start_date: startDate.toISOString().split('T')[0],
        notes: form.notes || undefined,
      });

      // Create case_lawyers entries
      for (const a of lawyerAssignments) {
        if (a.lawyerId) {
          await createCaseLawyer.mutateAsync({
            case_id: newCase.id,
            lawyer_id: a.lawyerId,
            commission_type: a.commissionType,
            commission_percentage: Number(a.commissionPercentage) || 0,
            commission_amount: Number(a.commissionAmount) || 0,
          });
        }
      }

      setForm({ clientName: '', clientEmail: '', clientPhone: '', serviceId: '', totalAmount: '', notes: '' });
      setStartDate(new Date());
      setLawyerAssignments([{ lawyerId: '', commissionType: 'percentage', commissionPercentage: '', commissionAmount: '' }]);
      onOpenChange(false);
    } catch (e) {
      // errors handled in mutation
    }
  };

  const assignedIds = lawyerAssignments.map(a => a.lawyerId).filter(Boolean);
  const activeLawyers = (lawyers as any[]).filter((l: any) => l.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl">Nuevo Caso</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre del Cliente *</Label>
            <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Nombre completo" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Select value={form.serviceId} onValueChange={(v) => {
                const svc = (services as any[]).find((s: any) => s.id === v);
                setForm({ ...form, serviceId: v, totalAmount: svc ? String(svc.base_price) : '' });
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                <SelectContent>
                  {(services as any[]).filter((s: any) => s.is_active).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha de Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
            <div className="space-y-2">
              <Label>Monto Total (USD)</Label>
              <Input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="0" />
            </div>
          </div>

          {/* Multiple Lawyer Assignments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Profesionales Asignados *</Label>
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

          <div className="space-y-2">
            <Label>Notas</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones del caso..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="btn-gold" onClick={handleSubmit} disabled={createCase.isPending}>
            {createCase.isPending ? 'Creando...' : 'Crear Caso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
