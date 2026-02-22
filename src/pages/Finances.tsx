import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DollarSign, TrendingUp, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAllCaseLawyers, useUpdateCaseLawyer, useDashboardStats } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Finances() {
  const [liquidateAllOpen, setLiquidateAllOpen] = useState(false);
  const [liquidateId, setLiquidateId] = useState<string | null>(null);

  const { data: caseLawyers = [] } = useAllCaseLawyers();
  const { data: stats } = useDashboardStats();
  const updateCaseLawyer = useUpdateCaseLawyer();

  const s = stats || { totalContracted: 0, montoPagado: 0, pendingCommissions: 0, totalCommissionsPaid: 0 };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const allCommissions = (caseLawyers as any[]).filter((cl: any) => Number(cl.commission_amount) > 0);
  const pendingCommissions = allCommissions.filter((cl: any) => !cl.commission_paid);
  const paidCommissions = allCommissions.filter((cl: any) => cl.commission_paid);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Control Financiero', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 30);

    // Summary
    doc.setFontSize(12);
    doc.text('Resumen', 14, 42);
    autoTable(doc, {
      startY: 46,
      head: [['Concepto', 'Monto']],
      body: [
        ['Monto Contratado', formatCurrency(s.totalContracted)],
        ['Remanente después de comisiones', formatCurrency(s.montoPagado)],
        ['Comisiones Pagadas', formatCurrency(s.totalCommissionsPaid)],
        ['Comisiones Pendientes', formatCurrency(s.pendingCommissions)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 37, 36] },
    });

    const afterSummary = (doc as any).lastAutoTable?.finalY || 80;

    // Pending commissions
    if (pendingCommissions.length > 0) {
      doc.setFontSize(12);
      doc.text('Comisiones Pendientes', 14, afterSummary + 10);
      autoTable(doc, {
        startY: afterSummary + 14,
        head: [['Caso', 'Profesional', 'Servicio', 'Monto Caso', 'Comisión']],
        body: pendingCommissions.map((cl: any) => [
          cl.case?.case_number || '—',
          cl.lawyer?.name || '—',
          cl.case?.service?.name || '—',
          formatCurrency(Number(cl.case?.total_amount || 0)),
          formatCurrency(Number(cl.commission_amount)),
        ]),
        foot: [['', '', '', 'Total', formatCurrency(pendingCommissions.reduce((sum: number, cl: any) => sum + Number(cl.commission_amount), 0))]],
        theme: 'striped',
        headStyles: { fillColor: [41, 37, 36] },
        footStyles: { fillColor: [245, 245, 244], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
    }

    const afterPending = (doc as any).lastAutoTable?.finalY || afterSummary + 10;

    // Paid commissions
    if (paidCommissions.length > 0) {
      const yPos = afterPending + 10;
      if (yPos > 260) doc.addPage();
      const startY = yPos > 260 ? 20 : yPos;
      doc.setFontSize(12);
      doc.text('Comisiones Pagadas', 14, startY);
      autoTable(doc, {
        startY: startY + 4,
        head: [['Caso', 'Profesional', 'Servicio', 'Comisión']],
        body: paidCommissions.map((cl: any) => [
          cl.case?.case_number || '—',
          cl.lawyer?.name || '—',
          cl.case?.service?.name || '—',
          formatCurrency(Number(cl.commission_amount)),
        ]),
        foot: [['', '', 'Total', formatCurrency(paidCommissions.reduce((sum: number, cl: any) => sum + Number(cl.commission_amount), 0))]],
        theme: 'striped',
        headStyles: { fillColor: [41, 37, 36] },
        footStyles: { fillColor: [245, 245, 244], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
    }

    doc.save(`control-financiero-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF descargado exitosamente');
  };

  const liquidateItem = (caseLawyers as any[]).find((cl: any) => cl.id === liquidateId);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Control Financiero</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestión de ingresos y comisiones</p>
        </div>
        <Button className="btn-gold gap-2 w-full sm:w-auto" onClick={handleExportPDF}>
          <Download className="h-4 w-4" /> Descargar PDF
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="stat-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 mb-3"><DollarSign className="h-5 w-5 text-success" /></div>
          <p className="text-xs sm:text-sm text-muted-foreground">Monto Contratado</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{formatCurrency(s.totalContracted)}</p>
        </div>
        <div className="stat-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 mb-3"><TrendingUp className="h-5 w-5 text-accent" /></div>
          <p className="text-xs sm:text-sm text-muted-foreground">Remanente</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{formatCurrency(s.montoPagado)}</p>
          <p className="text-[10px] text-muted-foreground">Después de comisiones</p>
        </div>
        <div className="stat-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3"><CheckCircle className="h-5 w-5 text-primary" /></div>
          <p className="text-xs sm:text-sm text-muted-foreground">Comisiones Pagadas</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{formatCurrency(s.totalCommissionsPaid)}</p>
        </div>
        <div className="stat-card bg-warning/5 border-warning/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 mb-3"><Clock className="h-5 w-5 text-warning" /></div>
          <p className="text-xs sm:text-sm text-muted-foreground">Comisiones Pendientes</p>
          <p className="text-lg sm:text-2xl font-bold text-warning tabular-nums">{formatCurrency(s.pendingCommissions)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="stat-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Comisiones Pendientes</h3>
              <p className="text-xs text-muted-foreground">Pagos por realizar</p>
            </div>
            {pendingCommissions.length > 0 && (
              <Button size="sm" className="btn-gold text-xs" onClick={() => setLiquidateAllOpen(true)}>Liquidar Todas</Button>
            )}
          </div>
          {pendingCommissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay comisiones pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingCommissions.map((cl: any) => (
                <div key={cl.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cl.lawyer?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{cl.case?.case_number || '—'} - {cl.case?.service?.name || ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-accent tabular-nums">{formatCurrency(Number(cl.commission_amount))}</p>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLiquidateId(cl.id)}>Liquidar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stat-card">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Comisiones Pagadas</h3>
          {paidCommissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay comisiones pagadas</p>
          ) : (
            <div className="space-y-3">
              {paidCommissions.map((cl: any) => (
                <div key={cl.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cl.lawyer?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{cl.case?.case_number || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-success tabular-nums">{formatCurrency(Number(cl.commission_amount))}</p>
                    <span className="badge-active inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                      <CheckCircle className="h-3 w-3" />Pagada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={liquidateAllOpen}
        onOpenChange={setLiquidateAllOpen}
        title="Liquidar Todas las Comisiones"
        description={`¿Confirmas la liquidación de ${pendingCommissions.length} comisiones pendientes por un total de ${formatCurrency(pendingCommissions.reduce((sum: number, cl: any) => sum + Number(cl.commission_amount), 0))}?`}
        confirmLabel="Liquidar Todas"
        onConfirm={async () => {
          for (const cl of pendingCommissions) {
            await updateCaseLawyer.mutateAsync({ id: cl.id, commission_paid: true });
          }
          setLiquidateAllOpen(false);
        }}
      />
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
