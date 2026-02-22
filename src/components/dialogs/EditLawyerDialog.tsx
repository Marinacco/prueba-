import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateLawyer } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface EditLawyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lawyer: any;
}

export function EditLawyerDialog({ open, onOpenChange, lawyer }: EditLawyerDialogProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialties: '' });
  const updateLawyer = useUpdateLawyer();

  useEffect(() => {
    if (lawyer) {
      setForm({
        name: lawyer.name || '',
        email: lawyer.email || '',
        phone: lawyer.phone || '',
        specialties: (lawyer.specialties || []).join(', '),
      });
    }
  }, [lawyer]);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    await updateLawyer.mutateAsync({
      id: lawyer.id,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()) : [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Editar Profesional</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre Completo *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Separar con coma" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="btn-gold" onClick={handleSubmit} disabled={updateLawyer.isPending}>
            {updateLawyer.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
