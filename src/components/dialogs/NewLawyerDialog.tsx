import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateLawyer } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface NewLawyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLawyerDialog({ open, onOpenChange }: NewLawyerDialogProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialties: '' });
  const createLawyer = useCreateLawyer();

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Por favor ingresa el nombre del profesional');
      return;
    }
    await createLawyer.mutateAsync({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()) : [],
    });
    setForm({ name: '', email: '', phone: '', specialties: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle className="font-display text-xl">Nuevo Profesional</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre Completo *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Lic. Juan Pérez" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@firma.com" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 55 1234 5678" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Ej: Derecho Corporativo, Fusiones (separar con coma)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="btn-gold" onClick={handleSubmit} disabled={createLawyer.isPending}>
            {createLawyer.isPending ? 'Registrando...' : 'Registrar Profesional'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
