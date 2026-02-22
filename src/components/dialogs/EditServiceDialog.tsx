import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateService } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
}

export function EditServiceDialog({ open, onOpenChange, service }: EditServiceDialogProps) {
  const [form, setForm] = useState({ name: '', description: '', category: '', basePrice: '', commissionType: 'fixed', commissionPercentage: '', isActive: true });
  const updateService = useUpdateService();

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || '',
        description: service.description || '',
        category: service.category || '',
        basePrice: String(service.base_price || ''),
        commissionType: service.commission_type || 'fixed',
        commissionPercentage: String(service.commission_percentage || ''),
        isActive: service.is_active ?? true,
      });
    }
  }, [service]);

  const handleSubmit = async () => {
    if (!form.name || !form.category) { toast.error('Completa los campos obligatorios'); return; }
    await updateService.mutateAsync({
      id: service.id,
      name: form.name,
      description: form.description || null,
      category: form.category,
      base_price: Number(form.basePrice) || 0,
      commission_type: form.commissionType,
      commission_percentage: Number(form.commissionPercentage) || 0,
      is_active: form.isActive,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Editar Servicio</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Corporativo">Corporativo</SelectItem>
                  <SelectItem value="Regulación Petrolera">Asesoramiento en materia de regulación petrolera</SelectItem>
                  <SelectItem value="Resolución de Controversias">Resolución de controversias</SelectItem>
                  <SelectItem value="Ética y Cumplimiento">Ética y cumplimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Precio Base (USD)</Label>
              <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="btn-gold" onClick={handleSubmit} disabled={updateService.isPending}>
            {updateService.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
