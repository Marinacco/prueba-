import { AlertTriangle, Clock, UserX, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'warning' | 'urgent' | 'info';
  title: string;
  description: string;
  time: string;
}

const alerts: Alert[] = [
  {
    id: '1',
    type: 'urgent',
    title: 'Pagos pendientes',
    description: '3 comisiones por pagar este mes',
    time: 'Hace 2h',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Casos sin asignar',
    description: '2 casos nuevos sin profesional',
    time: 'Hace 5h',
  },
  {
    id: '3',
    type: 'info',
    title: 'Caso próximo a vencer',
    description: 'CASO-2024-003 vence en 5 días',
    time: 'Hace 1d',
  },
];

const iconMap = {
  warning: UserX,
  urgent: DollarSign,
  info: Clock,
};

const colorMap = {
  warning: 'bg-warning/10 text-warning border-warning/20',
  urgent: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-primary/10 text-primary border-primary/20',
};

export function AlertCard() {
  return (
    <div className="stat-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Alertas
          </h3>
          <p className="text-sm text-muted-foreground">
            Notificaciones importantes
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type];
          return (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-soft cursor-pointer',
                colorMap[alert.type]
              )}
            >
              <div className="mt-0.5">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{alert.description}</p>
              </div>
              <span className="text-xs opacity-60 whitespace-nowrap">{alert.time}</span>
            </div>
          );
        })}
      </div>

      <button className="mt-4 w-full py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors">
        Ver todas las alertas →
      </button>
    </div>
  );
}
