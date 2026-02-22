import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCases, useLawyers } from '@/hooks/useSupabaseData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LawyerRankItem {
  id: string;
  name: string;
  contracted: number;
  commissions: number;
  commissionsPaid: number;
  cases: number;
  cobrado: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

function buildPDF(
  lawyers: LawyerRankItem[],
  totals: { contracted: number; commissions: number; commissionsPaid: number; cases: number; cobrado: number },
  startDate: string,
  endDate: string,
  title: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  const period = startDate || endDate
    ? `Periodo: ${startDate || 'Inicio'} — ${endDate || 'Actual'}`
    : 'Periodo: Todos los registros';
  doc.text(period, 14, 30);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 36);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Profesional', 'Casos', 'Monto Contratado', 'Comisiones', 'Com. Pagadas', 'Cobrado Neto']],
    body: lawyers.map((l, i) => [
      i + 1,
      l.name,
      l.cases,
      formatCurrency(l.contracted),
      formatCurrency(l.commissions),
      formatCurrency(l.commissionsPaid),
      formatCurrency(l.cobrado),
    ]),
    foot: lawyers.length > 1
      ? [['', 'TOTALES', totals.cases, formatCurrency(totals.contracted), formatCurrency(totals.commissions), formatCurrency(totals.commissionsPaid), formatCurrency(totals.cobrado)]]
      : undefined,
    theme: 'striped',
    headStyles: { fillColor: [41, 37, 36] },
    footStyles: { fillColor: [245, 245, 244], textColor: [0, 0, 0], fontStyle: 'bold' },
  });

  return doc;
}

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { data: cases = [] } = useCases();
  const { data: lawyers = [] } = useLawyers();

  const filteredCases = useMemo(() => {
    return (cases as any[]).filter((c: any) => {
      if (startDate && c.start_date < startDate) return false;
      if (endDate && c.start_date > endDate) return false;
      return true;
    });
  }, [cases, startDate, endDate]);

  const lawyerRanking = useMemo(() => {
    const map = new Map<string, LawyerRankItem>();
    for (const c of filteredCases) {
      const cls = c.case_lawyers || [];
      for (const cl of cls) {
        const lid = cl.lawyer_id;
        const lname = cl.lawyer?.name || '—';
        const prev = map.get(lid) || { id: lid, name: lname, contracted: 0, commissions: 0, commissionsPaid: 0, cases: 0, cobrado: 0 };
        prev.contracted += Number(c.total_amount || 0);
        prev.commissions += Number(cl.commission_amount || 0);
        if (cl.commission_paid) prev.commissionsPaid += Number(cl.commission_amount || 0);
        prev.cases += 1;
        prev.cobrado += Number(c.total_amount || 0) - Number(cl.commission_amount || 0);
        map.set(lid, prev);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.contracted - a.contracted);
  }, [filteredCases]);

  const totals = useMemo(() => {
    return lawyerRanking.reduce((acc, l) => ({
      contracted: acc.contracted + l.contracted,
      commissions: acc.commissions + l.commissions,
      commissionsPaid: acc.commissionsPaid + l.commissionsPaid,
      cases: acc.cases + l.cases,
      cobrado: acc.cobrado + l.cobrado,
    }), { contracted: 0, commissions: 0, commissionsPaid: 0, cases: 0, cobrado: 0 });
  }, [lawyerRanking]);

  const exportAllPDF = () => {
    const doc = buildPDF(lawyerRanking, totals, startDate, endDate, 'Reporte de Rendimiento de Profesionales');
    doc.save(`reporte-profesionales-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportIndividualPDF = (l: LawyerRankItem) => {
    const individual = { contracted: l.contracted, commissions: l.commissions, commissionsPaid: l.commissionsPaid, cases: l.cases, cobrado: l.cobrado };
    const doc = buildPDF([l], individual, startDate, endDate, `Reporte Individual — ${l.name}`);
    doc.save(`reporte-${l.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reportes de Rendimiento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ranking y análisis de desempeño por profesional</p>
        </div>
        <Button className="btn-gold gap-2" onClick={exportAllPDF} disabled={lawyerRanking.length === 0}>
          <Download className="h-4 w-4" /> Exportar PDF General
        </Button>
      </div>

      {/* Date filters */}
      <div className="stat-card mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div className="space-y-2">
            <Label className="text-sm">Fecha Inicio</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Fecha Fin</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>Limpiar Filtros</Button>
        </div>
      </div>

      {/* Ranking */}
      {lawyerRanking.length === 0 ? (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground">No hay datos de rendimiento para el periodo seleccionado.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="block lg:hidden space-y-4">
            {lawyerRanking.map((l, i) => (
              <div key={l.id} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      i === 0 ? 'bg-accent/20 text-accent' : i === 1 ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                    )}>#{i + 1}</span>
                    <div>
                      <p className="font-semibold text-foreground">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.cases} casos</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => exportIndividualPDF(l)} title="Descargar PDF individual">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Contratado:</span> <span className="tabular-nums font-semibold">{formatCurrency(l.contracted)}</span></div>
                  <div><span className="text-muted-foreground">Comisiones:</span> <span className="tabular-nums font-semibold text-accent">{formatCurrency(l.commissions)}</span></div>
                  <div><span className="text-muted-foreground">Com. Pagadas:</span> <span className="tabular-nums text-success">{formatCurrency(l.commissionsPaid)}</span></div>
                  <div><span className="text-muted-foreground">Cobrado Neto:</span> <span className="tabular-nums font-bold">{formatCurrency(l.cobrado)}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Efectividad:</span> <span className="font-semibold">{l.contracted > 0 ? ((l.cobrado / l.contracted) * 100).toFixed(1) : 0}%</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block stat-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4 text-left w-12">#</th>
                    <th className="px-6 py-4 text-left">Profesional</th>
                    <th className="px-6 py-4 text-center">Casos</th>
                    <th className="px-6 py-4 text-right">Monto Contratado</th>
                    <th className="px-6 py-4 text-right">Comisiones</th>
                    <th className="px-6 py-4 text-right">Com. Pagadas</th>
                    <th className="px-6 py-4 text-right">Cobrado Neto</th>
                    <th className="px-6 py-4 text-center">Efectividad</th>
                    <th className="px-6 py-4 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lawyerRanking.map((l, i) => (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                          i === 0 ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                        )}>#{i + 1}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{l.name}</td>
                      <td className="px-6 py-4 text-center tabular-nums">{l.cases}</td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums">{formatCurrency(l.contracted)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-accent">{formatCurrency(l.commissions)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-success">{formatCurrency(l.commissionsPaid)}</td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums">{formatCurrency(l.cobrado)}</td>
                      <td className="px-6 py-4 text-center font-semibold">{l.contracted > 0 ? ((l.cobrado / l.contracted) * 100).toFixed(1) : 0}%</td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="ghost" size="icon" onClick={() => exportIndividualPDF(l)} title="Descargar PDF individual">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-6 py-4" colSpan={2}>TOTALES</td>
                    <td className="px-6 py-4 text-center tabular-nums">{totals.cases}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatCurrency(totals.contracted)}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-accent">{formatCurrency(totals.commissions)}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-success">{formatCurrency(totals.commissionsPaid)}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{formatCurrency(totals.cobrado)}</td>
                    <td className="px-6 py-4 text-center">{totals.contracted > 0 ? ((totals.cobrado / totals.contracted) * 100).toFixed(1) : 0}%</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
