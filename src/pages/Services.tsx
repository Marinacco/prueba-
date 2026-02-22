import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NewServiceDialog } from '@/components/dialogs/NewServiceDialog';
import { EditServiceDialog } from '@/components/dialogs/EditServiceDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useServices, useDeleteService } from '@/hooks/useSupabaseData';

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: services = [], isLoading } = useServices();
  const deleteMutation = useDeleteService();

  const filteredServices = services.filter((s: any) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const deleteService = services.find((s: any) => s.id === deleteId);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Servicios Legales</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catálogo de servicios legales</p>
        </div>
        <Button className="btn-gold rounded-lg px-4 py-2 w-full sm:w-auto" onClick={() => setNewServiceOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Nuevo Servicio
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar servicios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="stat-card text-center py-8 text-muted-foreground">Cargando servicios...</div>
      ) : filteredServices.length === 0 ? (
        <div className="stat-card text-center py-8 text-muted-foreground">No hay servicios registrados. Crea el primero.</div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service: any) => (
            <div key={service.id} className="stat-card group relative overflow-hidden">
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{service.category}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setEditService(service)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(service.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precio Base</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(Number(service.base_price))}</span>
                </div>
              </div>
              <div className="mt-4">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', service.is_active ? 'badge-active' : 'badge-inactive')}>
                  {service.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewServiceDialog open={newServiceOpen} onOpenChange={setNewServiceOpen} />
      <EditServiceDialog open={!!editService} onOpenChange={(o) => !o && setEditService(null)} service={editService} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar Servicio"
        description={`¿Estás seguro de eliminar "${deleteService?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(deleteId!); setDeleteId(null); }}
      />
    </MainLayout>
  );
}
