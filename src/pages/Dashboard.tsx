import { DollarSign, Briefcase, TrendingUp, Trophy } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardStats, useCases } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: cases } = useCases();
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const s = stats || { totalContracted: 0, montoPagado: 0, pendingCommissions: 0, activeCases: 0, completedCases: 0, totalLawyers: 0, totalClients: 0, totalCommissionsPaid: 0, caseLawyers: [] };

  // Lawyer ranking
  const lawyerMap = new Map<string, { name: string; contracted: number; commissions: number; commissionsPaid: number; cases: number }>();
  if (cases) {
    for (const c of cases as any[]) {
      const cls = c.case_lawyers || [];
      for (const cl of cls) {
        const lid = cl.lawyer_id;
        const lname = cl.lawyer?.name || '—';
        const prev = lawyerMap.get(lid) || { name: lname, contracted: 0, commissions: 0, commissionsPaid: 0, cases: 0 };
        prev.contracted += Number(c.total_amount || 0);
        prev.commissions += Number(cl.commission_amount || 0);
        if (cl.commission_paid) prev.commissionsPaid += Number(cl.commission_amount || 0);
        prev.cases += 1;
        lawyerMap.set(lid, prev);
      }
    }
  }
  const lawyerRanking = Array.from(lawyerMap.values()).sort((a, b) => b.contracted - a.contracted);

  return (
    <MainLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Resumen general del rendimiento de la firma</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        <StatCard title="Monto Contratado" value={formatCurrency(s.totalContracted)} subtitle={`${s.activeCases} activos`} icon={<DollarSign className="h-6 w-6" />} variant="accent" />
        <StatCard title="Remanente" value={formatCurrency(s.montoPagado)} subtitle="Después de comisiones" icon={<TrendingUp className="h-6 w-6" />} />
        <StatCard title="Com. Pagadas" value={formatCurrency(s.totalCommissionsPaid)} subtitle="Liquidadas" icon={<Trophy className="h-6 w-6" />} />
        <StatCard title="Com. Pendientes" value={formatCurrency(s.pendingCommissions)} subtitle="Por liquidar" icon={<Briefcase className="h-6 w-6" />} />
      </div>

      {/* Charts Row: Pie (by service) + Line (revenue & commissions) */}
      {cases && (cases as any[]).length > 0 && (() => {
        // Pie: distribution by service
        const serviceCounts = (cases as any[]).reduce((acc: Record<string, number>, c: any) => {
          const label = c.service?.name || 'Sin servicio';
          acc[label] = (acc[label] || 0) + 1;
          return acc;
        }, {});
        const pieData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }));
        const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(142 71% 45%)', 'hsl(var(--destructive))', 'hsl(45 93% 47%)', 'hsl(200 80% 50%)'];

        // Line: monthly revenue & commissions
        const monthlyMap = new Map<string, { revenue: number; commissions: number }>();
        for (const c of cases as any[]) {
          const date = c.start_date || c.created_at?.split('T')[0];
          if (!date) continue;
          const monthKey = date.substring(0, 7); // YYYY-MM
          const prev = monthlyMap.get(monthKey) || { revenue: 0, commissions: 0 };
          prev.revenue += Number(c.total_amount || 0);
          const totalComm = (c.case_lawyers || []).reduce((s: number, cl: any) => s + Number(cl.commission_amount || 0), 0);
          prev.commissions += totalComm;
          monthlyMap.set(monthKey, prev);
        }
        const lineData = Array.from(monthlyMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({
            month: format(parseISO(`${month}-01`), 'MMM yy', { locale: es }),
            Monto Contratado: data.revenue,
            Comisiones: data.commissions,
          }));

        return (
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <h3 className="text-base font-bold text-foreground">Distribución por Servicio</h3>
              </div>
              <div className={isMobile ? "h-[200px]" : "h-[280px]"}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy={isMobile ? "40%" : "50%"}
                      innerRadius={isMobile ? 30 : 55}
                      outerRadius={isMobile ? 55 : 95}
                      paddingAngle={isMobile ? 3 : 5}
                      dataKey="value"
                      cornerRadius={isMobile ? 3 : 6}
                      label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={isMobile ? false : { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '8px 12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500, fontSize: '12px' }}
                    />
                    <Legend iconType="circle" iconSize={isMobile ? 6 : 10} wrapperStyle={{ fontSize: isMobile ? '10px' : '13px', paddingTop: isMobile ? '4px' : '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <h3 className="text-base font-bold text-foreground> Monto Contratado vs Comisiones</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 500 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="Monto Contratado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }} activeDot={{ r: 7, strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="Comisiones" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 5, fill: 'hsl(var(--accent))', strokeWidth: 2, stroke: 'hsl(var(--background))' }} activeDot={{ r: 7, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lawyer Ranking */}
      {lawyerRanking.length > 0 && (
        <div className="stat-card mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Ranking de Profesionales</h3>
              <p className="text-xs text-muted-foreground">{lawyerRanking.length} profesionales registrados</p>
            </div>
          </div>
          {/* Mobile cards */}
          <div className="block lg:hidden space-y-3">
            {lawyerRanking.map((l, i) => (
              <div key={i} className={cn('p-4 rounded-lg border transition-colors',
                i === 0 ? 'border-accent/30 bg-accent/5' : 'border-border'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      i === 0 ? 'bg-accent/20 text-accent' : i === 1 ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                    )}>#{i + 1}</span>
                    <span className="font-semibold text-foreground">{l.name}</span>
                  </div>
                  <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">{l.cases} casos</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-muted/30 rounded-md p-2"><span className="block text-muted-foreground mb-0.5">Contratado</span><span className="tabular-nums font-bold text-foreground">{formatCurrency(l.contracted)}</span></div>
                  <div className="bg-accent/5 rounded-md p-2"><span className="block text-muted-foreground mb-0.5">Comisiones</span><span className="tabular-nums font-bold text-accent">{formatCurrency(l.commissions)}</span></div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3.5 text-left w-12">#</th>
                  <th className="px-4 py-3.5 text-left">Profesional</th>
                  <th className="px-4 py-3.5 text-center">Casos</th>
                  <th className="px-4 py-3.5 text-right">Monto Contratado</th>
                  <th className="px-4 py-3.5 text-right">Comisiones Generadas</th>
                  <th className="px-4 py-3.5 text-right">Comisiones Pagadas</th>
                  <th className="px-4 py-3.5 text-right">Remanente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lawyerRanking.map((l, i) => (
                  <tr key={i} className={cn('transition-colors', i === 0 ? 'bg-accent/5' : 'hover:bg-muted/30')}>
                    <td className="px-4 py-3.5">
                      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        i === 0 ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                      )}>#{i + 1}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{l.name}</td>
                    <td className="px-4 py-3.5 text-center"><span className="bg-muted px-2.5 py-1 rounded-full text-xs font-medium tabular-nums">{l.cases}</span></td>
                    <td className="px-4 py-3.5 text-right font-bold tabular-nums text-foreground">{formatCurrency(l.contracted)}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-accent">{formatCurrency(l.commissions)}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-success">{formatCurrency(l.commissionsPaid)}</td>
                    <td className="px-4 py-3.5 text-right font-bold tabular-nums text-foreground">{formatCurrency(l.contracted - l.commissions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Cases */}
      {cases && (cases as any[]).length > 0 && (
        <div className="stat-card mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Casos Recientes</h3>
              <p className="text-xs text-muted-foreground">Últimos 5 casos registrados</p>
            </div>
          </div>
          <div className="block lg:hidden space-y-3">
            {(cases as any[]).slice(0, 5).map((c: any) => (
              <div key={c.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-foreground">{c.case_number}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    c.status === 'completed' ? 'bg-primary/10 text-primary border border-primary/20' :
                    c.status === 'active' ? 'badge-active' : 'badge-pending'
                  )}>
                    {c.status === 'active' ? 'Activo' : c.status === 'in_progress' ? 'En Proceso' : c.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{c.client?.name || '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(c.case_lawyers || []).map((cl: any) => cl.lawyer?.name).filter(Boolean).join(', ') || '—'}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{c.start_date ? format(parseISO(c.start_date), "d MMM yyyy", { locale: es }) : '—'}</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(Number(c.total_amount))}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3.5 text-left">Caso</th>
                  <th className="px-4 py-3.5 text-left">Cliente</th>
                  <th className="px-4 py-3.5 text-left">Profesionales</th>
                  <th className="px-4 py-3.5 text-left">Fecha Inicio</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(cases as any[]).slice(0, 5).map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5"><span className="font-mono text-sm font-bold text-foreground">{c.case_number}</span></td>
                    <td className="px-4 py-3.5"><span className="text-sm font-medium text-foreground">{c.client?.name || '—'}</span></td>
                    <td className="px-4 py-3.5"><span className="text-sm text-foreground">{(c.case_lawyers || []).map((cl: any) => cl.lawyer?.name).filter(Boolean).join(', ') || '—'}</span></td>
                    <td className="px-4 py-3.5"><span className="text-sm text-muted-foreground tabular-nums">{c.start_date ? format(parseISO(c.start_date), "d MMM yyyy", { locale: es }) : '—'}</span></td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        c.status === 'completed' ? 'bg-primary/10 text-primary border border-primary/20' :
                        c.status === 'active' ? 'badge-active' : 'badge-pending'
                      )}>
                        {c.status === 'active' ? 'Activo' : c.status === 'in_progress' ? 'En Proceso' : c.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold text-foreground tabular-nums">{formatCurrency(Number(c.total_amount))}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!cases?.length && (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground text-lg">No hay datos todavía. Comienza agregando abogados, servicios y casos.</p>
        </div>
      )}
    </MainLayout>
  );
}
