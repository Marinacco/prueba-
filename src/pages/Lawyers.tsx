import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, MoreVertical, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NewLawyerDialog } from '@/components/dialogs/NewLawyerDialog';
import { EditLawyerDialog } from '@/components/dialogs/EditLawyerDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useLawyers, useDeleteLawyer } from '@/hooks/useSupabaseData';

export default function Lawyers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newLawyerOpen, setNewLawyerOpen] = useState(false);
  const [editLawyer, setEditLawyer] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: lawyers = [], isLoading } = useLawyers();
  const deleteMutation = useDeleteLawyer();

  const filteredLawyers = lawyers.filter((l: any) =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.specialties || []).some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const deleteLawyerItem = lawyers.find((l: any) => l.id === deleteId);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Directorio de Profesionales</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestión de perfiles y rendimiento del equipo</p>
        </div>
        <Button className="btn-gold rounded-lg px-4 py-2 w-full sm:w-auto" onClick={() => setNewLawyerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Nuevo Profesional
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o especialidad..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="stat-card text-center py-8 text-muted-foreground">Cargando profesionales...</div>
      ) : filteredLawyers.length === 0 ? (
        <div className="stat-card text-center py-8 text-muted-foreground">No hay profesionales registrados. Agrega el primero.</div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLawyers.map((lawyer: any) => (
            <div key={lawyer.id} className="stat-card group relative overflow-hidden">
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setEditLawyer(lawyer)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(lawyer.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground flex-shrink-0">
                  {lawyer.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">{lawyer.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(lawyer.specialties || []).slice(0, 2).map((s: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {lawyer.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4 flex-shrink-0" /><span className="truncate">{lawyer.email}</span></div>}
                {lawyer.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4 flex-shrink-0" /><span>{lawyer.phone}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewLawyerDialog open={newLawyerOpen} onOpenChange={setNewLawyerOpen} />
      <EditLawyerDialog open={!!editLawyer} onOpenChange={(o) => !o && setEditLawyer(null)} lawyer={editLawyer} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar Profesional"
        description={`¿Estás seguro de eliminar a "${deleteLawyerItem?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(deleteId!); setDeleteId(null); }}
      />
    </MainLayout>
  );
}
