import type { ComponentType, ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const shellClass =
  'relative flex h-full min-h-0 max-h-full w-full max-w-[20rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-600/50 bg-slate-800 text-slate-200 shadow-lg shadow-slate-900/30 ring-1 ring-white/5';

const navClass =
  'flex min-h-0 min-w-0 flex-1 flex-col gap-0.5 overflow-hidden px-2 pb-2 pt-1 font-sans text-sm font-medium';

const itemBase =
  'group flex w-full items-center rounded-xl px-3 py-2.5 text-left leading-snug outline-none transition-[color,background-color] duration-75 ease-out text-slate-300 hover:bg-white/6 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500/50';

const itemActive =
  'bg-indigo-500/15 text-white shadow-inner shadow-indigo-950/20 ring-1 ring-indigo-400/25';

function IconWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/4 text-slate-400 transition-[color,background-color] duration-75 ease-out group-hover:bg-white/8 group-hover:text-indigo-200 group-[.is-nav-active]:bg-indigo-500/25 group-[.is-nav-active]:text-indigo-100">
      {children}
    </div>
  );
}

function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
      <path d="M12 22V12" />
      <path d="M4 7l8 5 8-5" />
    </svg>
  );
}

function IconHome({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.25 8.25a.75.75 0 11-1.06 1.06l-.75-.75V19a2.25 2.25 0 01-2.25 2.25h-3.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-3.5A2.25 2.25 0 013 19v-6.66l-.75.75a.75.75 0 11-1.06-1.06l8.25-8.25z" />
    </svg>
  );
}

function IconShoppingBag({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconChart({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.25c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.25zM3 12.75c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v7.5c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 20.25v-7.5z" />
    </svg>
  );
}

function IconFolder({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.906 9c.382 0 .749.057 1.094.162V9a3 3 0 00-3-3h-3.879a.75.75 0 01-.53-.22L11.47 3.66A1.5 1.5 0 0010.396 3H4.75A3 3 0 001.5 6v.375c0 .621.503 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-.375a3 3 0 00-3-3h-1.531zM4.875 10.5a.75.75 0 00-.75.75v9c0 .621.504 1.125 1.125 1.125h15a1.125 1.125 0 001.125-1.125v-9a.75.75 0 00-.75-.75H4.875z" />
    </svg>
  );
}

function IconInbox({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M6.912 3a3 3 0 00-2.868 2.118l-2.411 7.838a3 3 0 00-.133.882V18a3 3 0 003 3h15a3 3 0 003-3v-4.162c0-.299-.045-.596-.133-.882l-2.412-7.838A3 3 0 0017.088 3H6.912zm13.823 9.75l-2.213-7.191A1.5 1.5 0 0017.088 4.5H6.912a1.5 1.5 0 00-1.434 1.059L3.265 12.75H6.11a3 3 0 012.684 1.658l.256.513a1.5 1.5 0 001.342.829h3.218a1.5 1.5 0 001.342-.83l.256-.512a3 3 0 012.684-1.658h2.844z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconLogout({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9a.75.75 0 01-1.5 0V5.25a1.5 1.5 0 00-1.5-1.5h-6zm11.03 4.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H9a.75.75 0 000 1.5h6.19l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconArrows({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
    </svg>
  );
}

function IconTruck({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.75 3h-8.5a2.25 2.25 0 00-2.25 2.25v8.25a3 3 0 003 3h10.5a3 3 0 003-3V9a3 3 0 00-3-3zm-1.5 6h-6v-3h6v3z" />
      <path d="M4 17.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm12 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </svg>
  );
}

function IconWrench({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

type NavItem = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  badge?: string | number;
};

const DEFAULT_ITEMS: NavItem[] = [
  { to: '/productos', label: 'Productos', Icon: IconShoppingBag },
  { to: '/inventory-movements', label: 'Movimientos', Icon: IconArrows },
  { to: '/compras', label: 'Compras', Icon: IconTruck },
  { to: '/ventas', label: 'Ventas', Icon: IconChart },
  { to: '/clientes', label: 'Clientes', Icon: IconFolder },
];

const TECH_ITEMS: NavItem[] = [
  { to: '/tecnicos', label: 'Técnicos', Icon: IconWrench },
  { to: '/soporte', label: 'Soporte técnico', Icon: IconInbox },
];

const guestLinkClass =
  'flex w-full items-center justify-center rounded-xl border border-indigo-400/30 bg-white/4 px-3 py-2.5 text-center text-sm font-medium text-indigo-100 transition-[color,background-color,border-color] duration-75 ease-out hover:border-indigo-300/50 hover:bg-white/8';

const guestPrimaryClass =
  'flex w-full items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 ring-4 ring-indigo-500/10 transition-opacity hover:opacity-95';

type AppSidebarProps = {
  title?: string;
  items?: NavItem[];
  techItems?: NavItem[];
};

export function AppSidebar({ title = 'Smartcel', items = DEFAULT_ITEMS, techItems = TECH_ITEMS }: AppSidebarProps) {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const initial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    '?';

  return (
    <div className={shellClass}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_100%_90%_at_50%_-30%,rgba(99,102,241,0.14),transparent)]"
        aria-hidden
      />

      <div className="relative shrink-0 px-4 pb-3 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/10">
            <BrandMark />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="font-sans text-lg font-bold leading-tight tracking-tight text-white">{title}</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Sistema moderno</p>
          </div>
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menú</p>
      </div>

      <nav className={navClass} aria-label={title}>
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">General</p>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [itemBase, 'group', isActive ? `${itemActive} is-nav-active` : ''].filter(Boolean).join(' ')
          }
        >
          <IconWrapper>
            <IconHome />
          </IconWrapper>
          <span className="flex-1">Inicio</span>
        </NavLink>

        <div className="my-2 border-t border-slate-600/30" />
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Operaciones</p>
        {items.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [itemBase, 'group', isActive ? `${itemActive} is-nav-active` : ''].filter(Boolean).join(' ')
            }
          >
            <IconWrapper>
              <Icon />
            </IconWrapper>
            <span className="flex-1">{label}</span>
            {badge != null && badge !== '' ? (
              <span className="ml-2 shrink-0 rounded-full bg-indigo-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-100">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}

        <div className="my-2 border-t border-slate-600/30" />
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Soporte técnico</p>

        {techItems.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [itemBase, 'group', isActive ? `${itemActive} is-nav-active` : ''].filter(Boolean).join(' ')
            }
          >
            <IconWrapper>
              <Icon />
            </IconWrapper>
            <span className="flex-1">{label}</span>
            {badge != null && badge !== '' ? (
              <span className="ml-2 shrink-0 rounded-full bg-indigo-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-100">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-slate-600/40 p-3">
        {isAuthenticated && user ? (
          <div className="rounded-xl border border-slate-600/50 bg-slate-900/35 p-3">
            <div className="mb-3 flex gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500/80 to-violet-600/80 text-sm font-bold text-white shadow-md shadow-indigo-950/30 ring-2 ring-white/10"
                aria-hidden
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              className="flex w-full items-center rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-300 transition-[color,background-color] duration-75 ease-out hover:bg-white/6 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              onClick={handleLogout}
            >
              <IconWrapper>
                <IconLogout />
              </IconWrapper>
              <span className="flex-1">Cerrar sesión</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link to="/login" className={guestLinkClass}>
              Iniciar sesión
            </Link>
            <Link to="/register" className={guestPrimaryClass}>
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
