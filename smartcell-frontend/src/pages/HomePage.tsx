import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';

export function HomePage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* md+: fuera del flujo — no se mueve con el scroll del panel; solo el Outlet scrollea */}
      <aside
        className="flex w-full shrink-0 flex-col border-b border-slate-700/60 bg-slate-800 p-3 md:fixed md:left-0 md:top-0 md:z-20 md:h-dvh md:max-h-dvh md:w-64 xl:w-80 md:overflow-hidden md:border-b-0 md:border-r md:border-slate-700/60"
        aria-label="Navegación lateral"
      >
        <AppSidebar title="Beatcell" />
      </aside>
      {/* md:ml-80 = hueco del sidebar fijo (w-80); flex-1 + min-h-0 para que el overflow-y-auto del hijo funcione */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 md:ml-64 xl:ml-80">
        {/* Capa fija al panel (no crece con el contenido): menos repintado al hacer scroll */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-100 via-slate-100 to-indigo-50/40 transform-[translateZ(0)] contain-[paint]"
          aria-hidden
        />
        {/* Un solo contenedor con scroll: sin overflow anidado en páginas hijas; contain ayuda al motor de composición */}
        <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain contain-[content] [overflow-anchor:none]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
