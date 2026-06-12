import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
          role="status"
          aria-label="Cargando"
        />
        <p className="text-sm text-slate-600">Cargando sesión…</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
