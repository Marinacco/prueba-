import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  Shield,
  Bell,
  Database,
  Mail,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const settingsSections = [
  { icon: Building2, label: 'Firma', id: 'firm' },
  { icon: Shield, label: 'Seguridad', id: 'security' },
  { icon: Bell, label: 'Alertas', id: 'notifications' },
  { icon: Database, label: 'Respaldos', id: 'backups' },
  { icon: Mail, label: 'Reporte', id: 'weekly-report' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('firm');
  const [weeklyEmail, setWeeklyEmail] = useState('');
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['weekly_report_email', 'weekly_report_enabled']);
      if (data) {
        for (const row of data) {
          if (row.key === 'weekly_report_email') setWeeklyEmail(row.value || '');
          if (row.key === 'weekly_report_enabled') setWeeklyEnabled(row.value === 'true');
        }
      }
    };
    load();
  }, []);

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente');
  };

  const handleSaveWeeklyReport = async () => {
    setLoadingEmail(true);
    try {
      await supabase.from('app_settings').update({ value: weeklyEmail }).eq('key', 'weekly_report_email');
      await supabase.from('app_settings').update({ value: weeklyEnabled ? 'true' : 'false' }).eq('key', 'weekly_report_enabled');
      toast.success('Configuración de reporte semanal guardada');
    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    if (!weeklyEmail) {
      toast.error('Ingresa un correo electrónico primero');
      return;
    }
    setLoadingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-report');
      if (error) throw error;
      toast.success('Reporte de prueba enviado exitosamente');
    } catch (err: any) {
      toast.error('Error al enviar reporte: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-4 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administración del sistema y preferencias</p>
      </div>

      {/* Mobile: horizontal scrollable tabs */}
      <div className="lg:hidden mb-4 -mx-3 px-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {settingsSections.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex-shrink-0 ${
                activeSection === item.id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Desktop Settings Navigation */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="stat-card">
            <nav className="space-y-1">
              {settingsSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {activeSection === 'firm' && (
            <>
              <div className="stat-card">
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Información de la Firma</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Datos generales de la organización</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firmName" className="text-sm">Nombre de la Firma</Label>
                      <Input id="firmName" placeholder="Nombre de la firma" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rfc" className="text-sm">TAX</Label>
                      <Input id="rfc" placeholder="Tax ID" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-sm">Dirección</Label>
                    <Input id="address" placeholder="Dirección completa" />
                  </div>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">Teléfono</Label>
                      <Input id="phone" placeholder="Teléfono principal" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">Correo Electrónico</Label>
                      <Input id="email" type="email" placeholder="Correo de contacto" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Configuración de Comisiones</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Reglas generales para el cálculo de comisiones</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="defaultCommission" className="text-sm">Comisión por Defecto (%)</Label>
                      <Input id="defaultCommission" type="number" placeholder="Porcentaje" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="paymentPeriod" className="text-sm">Período de Pago</Label>
                      <Input id="paymentPeriod" placeholder="Período" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">Cálculo automático de comisiones</p>
                      <p className="text-xs text-muted-foreground">Calcular comisiones al cerrar un caso</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">Notificar comisiones pendientes</p>
                      <p className="text-xs text-muted-foreground">Enviar recordatorios de pagos pendientes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="btn-gold gap-2 w-full sm:w-auto" onClick={handleSave}>
                  <Save className="h-4 w-4" />Guardar Cambios
                </Button>
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <div className="stat-card">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Seguridad</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Configuración de seguridad y acceso</p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 rounded-lg border border-border">
                  <h4 className="font-display text-base font-semibold text-foreground mb-3">Roles del Sistema</h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-accent/10 text-accent">Administrador</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">Acceso completo</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Autenticación de dos factores</p>
                    <p className="text-xs text-muted-foreground">Capa adicional de seguridad</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Bloqueo por inactividad</p>
                    <p className="text-xs text-muted-foreground">Cerrar sesión tras 30 min inactivo</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="stat-card">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Notificaciones</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Preferencias de alertas y avisos</p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Notificar casos nuevos</p>
                    <p className="text-xs text-muted-foreground">Alerta al crear un caso</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Comisiones pendientes</p>
                    <p className="text-xs text-muted-foreground">Recordatorio de pagos por liquidar</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Vencimiento de casos</p>
                    <p className="text-xs text-muted-foreground">Alerta de casos próximos a vencer</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Resumen diario por correo</p>
                    <p className="text-xs text-muted-foreground">Resumen de actividad al final del día</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'backups' && (
            <div className="stat-card">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Respaldos</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Gestión de copias de seguridad</p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Respaldo automático diario</p>
                    <p className="text-xs text-muted-foreground">Todos los días a las 2:00 AM</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Retención de respaldos</p>
                    <p className="text-xs text-muted-foreground">Mantener por 30 días</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="btn-gold gap-2 w-full sm:w-auto" onClick={() => toast.success('Respaldo iniciado')}>
                  <Database className="h-4 w-4" /> Crear Respaldo Ahora
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'weekly-report' && (
            <div className="stat-card">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Reporte Semanal por Correo</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Envío automático del reporte de rendimiento</p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">Envío semanal activado</p>
                    <p className="text-xs text-muted-foreground">Cada lunes a las 8:00 AM</p>
                  </div>
                  <Switch checked={weeklyEnabled} onCheckedChange={setWeeklyEnabled} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reportEmail" className="text-sm">Correo destino</Label>
                  <Input
                    id="reportEmail"
                    type="email"
                    value={weeklyEmail}
                    onChange={(e) => setWeeklyEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="btn-gold gap-2 w-full sm:w-auto" onClick={handleSaveWeeklyReport} disabled={loadingEmail}>
                    <Save className="h-4 w-4" /> Guardar
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={handleTestEmail} disabled={loadingEmail || !weeklyEmail}>
                    <Mail className="h-4 w-4 mr-2" /> Enviar Prueba
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
