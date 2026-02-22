import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import logoImg from '@/assets/logo.ico';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Casos', href: '/cases', icon: Briefcase },
  { name: 'Comisiones', href: '/commissions', icon: DollarSign },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Servicios', href: '/services', icon: FileText },
  { name: 'Profesionales', href: '/lawyers', icon: Users },
  { name: 'Finanzas', href: '/finances', icon: DollarSign },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'US';

  return (
    <aside className="h-full w-full bg-sidebar lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:border-r lg:border-sidebar-border">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Prueba</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn('nav-item', isActive && 'nav-item-active')}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-primary-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email || 'Usuario'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="p-2 rounded-md hover:bg-sidebar-border transition-colors">
              <LogOut className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
