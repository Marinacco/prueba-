import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logoImg from '@/assets/logo.ico';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-3 gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-1 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors active:scale-95">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 gap-0 bg-sidebar border-sidebar-border [&>button:last-child]:hidden">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-base font-semibold text-sidebar-foreground">Prueba</span>
        </div>
      </header>

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="p-3 sm:p-5 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
