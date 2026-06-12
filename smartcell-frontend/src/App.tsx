import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import TechniciansPage from './pages/technicians/TechniciansPage';
import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { GuestRoute } from './components/GuestRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage, RegisterPage } from './modules/auth';
import { fetchPublicConfig } from './api/config';
import {
  ClientesPage,
  HomeDashboard,
  HomePage,
  UsersPage,
  InventoryMovementsPage,
  ProductosPage,
  SoportePage,
  VentasPage,
  ComprasPage,
} from './pages';
import type { ReactNode } from 'react';

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-dvh min-h-0 max-h-dvh flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </main>
  );
}

export default function App() {
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar configuración pública del servidor al iniciar
    fetchPublicConfig()
      .then((config) => {
        if (config) {
          console.log('✅ App iniciada con configuración correcta');
          setConfigLoaded(true);
        } else {
          const error = 'No se pudo cargar la configuración del servidor';
          console.error(error);
          setConfigError(error);
        }
      })
      .catch((error) => {
        console.error('❌ Error al cargar configuración:', error);
        setConfigError(error.message);
      });
  }, []);

  // Mostrar error si no se pudo cargar la configuración
  if (configError) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Error de Configuración</h1>
          <p className="text-red-500 mb-2">{configError}</p>
          <p className="text-gray-600">
            Verifica la conexión con el servidor backend.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se carga la configuración
  if (!configLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Cargando configuración...</p>
          <p className="text-gray-600 text-sm">Conectando con el servidor...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />}>
              <Route index element={<HomeDashboard />} />
              <Route
                path="productos"
                element={
                  <ProtectedRoute>
                    <ProductosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas"
                element={
                  <ProtectedRoute>
                    <VentasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="compras"
                element={
                  <ProtectedRoute>
                    <ComprasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes"
                element={
                  <ProtectedRoute>
                    <ClientesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory-movements"
                element={
                  <ProtectedRoute>
                    <InventoryMovementsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="soporte" element={<SoportePage />} />
              <Route
                path="usuarios"
                element={
                  <ProtectedRoute requireAdmin>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tecnicos"
                element={
                  <ProtectedRoute>
                    <TechniciansPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute requireAdmin>
                  <RegisterPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
