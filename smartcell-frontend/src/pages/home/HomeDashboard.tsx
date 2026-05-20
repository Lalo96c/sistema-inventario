import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../../api/dashboardService';
import { SalesChart } from '../../components/charts/SalesChart';
import { TopProductsChart } from '../../components/charts/TopProductsChart';
import { MetricCard, Icons } from '../../components/charts/MetricCard';
import { formatCurrency } from '../../utils/format';

function EndpointCard({
    method,
    path,
    detail,
}: {
    method: string;
    path: string;
    detail?: string;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border border-slate-200/60 bg-slate-50 px-3 py-2.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-indigo-800">
                    {method}
                </span>
                <code className="text-xs font-medium text-slate-800">{path}</code>
            </div>
            {detail ? <p className="text-xs text-slate-500">{detail}</p> : null}
        </div>
    );
}

export function HomeDashboard() {
    const { isAuthenticated, user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            loadStats();
        }
    }, [isAuthenticated]);

    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchDashboardStats();
            setStats(data);
        } catch (err) {
            setError('Error al cargar estadísticas');
            console.error('Error loading dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">

            <div className="relative overflow-hidden border-b border-indigo-100 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-10 sm:px-8">
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 opacity-60"
                    aria-hidden
                />
                <div className="relative mx-auto max-w-6xl">
                    <p className="text-sm font-medium text-indigo-200">Panel</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        {isAuthenticated && user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'Bienvenido'}
                    </h1>
                    <p className="mt-3 max-w-xl text-base text-indigo-100">
                        Gestiona productos, categorías y ventas desde un solo lugar. Frontend React + Tailwind con autenticación JWT
                        contra tu API Laravel.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            to="/productos"
                            className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-50"
                        >
                            Ver productos
                        </Link>
                        <Link
                            to="/ventas"
                            className="inline-flex items-center rounded-lg border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
                        >
                            Ventas
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 sm:p-8">
                {isAuthenticated ? (
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* Loading state */}
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                                    <p className="mt-2 text-sm text-slate-600">Cargando estadísticas...</p>
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50/50 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-red-900">Error al cargar datos</h3>
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dashboard content */}
                        {!loading && !error && stats && (
                            <>
                                {/* Métricas principales */}
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <MetricCard
                                        title="Total productos"
                                        value={stats?.general.total_products ?? 0}
                                        subtitle="En inventario"
                                        icon={<Icons.Products />}
                                    />
                                    <MetricCard
                                        title="Total clientes"
                                        value={stats?.general.total_clients ?? 0}
                                        subtitle="Registrados"
                                        icon={<Icons.Clients />}
                                    />
                                    <MetricCard
                                        title="Total ventas"
                                        value={stats?.general.total_sales ?? 0}
                                        subtitle="Transacciones"
                                        icon={<Icons.Sales />}
                                    />
                                    <MetricCard
                                        title="Total compras"
                                        value={stats?.general.total_purchases ?? 0}
                                        subtitle="Transacciones"
                                        icon={<Icons.Purchases />}
                                    />
                                </div>

                                {/* Ingresos y Egresos */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <MetricCard
                                        title="Ventas del mes"
                                        value={formatCurrency(stats?.general.current_month_sales ?? 0)}
                                        subtitle="Mes actual (Ingresos)"
                                        icon={<Icons.Revenue />}
                                        className="border-green-200 bg-green-50/50"
                                        trend={stats ? {
                                            value: stats.general.sales_growth,
                                            label: 'vs mes anterior'
                                        } : undefined}
                                    />
                                    <MetricCard
                                        title="Compras del mes"
                                        value={formatCurrency(stats?.general.current_month_purchases ?? 0)}
                                        subtitle="Mes actual (Egresos)"
                                        icon={<Icons.Expenses />}
                                        className="border-orange-200 bg-orange-50/50"
                                        trend={stats ? {
                                            value: stats.general.purchases_growth,
                                            label: 'vs mes anterior'
                                        } : undefined}
                                    />
                                </div>

                                {/* Estado del inventario */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <MetricCard
                                        title="Stock bajo"
                                        value={stats?.inventory.low_stock ?? 0}
                                        subtitle="Menos de 10 unidades"
                                        icon={<Icons.LowStock />}
                                        className="border-amber-200 bg-amber-50/50"
                                    />
                                    <MetricCard
                                        title="Sin stock"
                                        value={stats?.inventory.out_of_stock ?? 0}
                                        subtitle="Agotados"
                                        icon={<Icons.OutOfStock />}
                                        className="border-red-200 bg-red-50/50"
                                    />
                                </div>

                                {/* Gráficos */}
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Ventas por mes */}
                                    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                            Ventas por mes (Ingresos)
                                        </h3>
                                        {stats?.charts.sales_by_month && stats.charts.sales_by_month.length > 0 ? (
                                            <SalesChart data={stats.charts.sales_by_month} />
                                        ) : (
                                            <div className="flex h-64 items-center justify-center text-slate-500">
                                                <p>No hay datos de ventas disponibles</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Compras por mes */}
                                    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                            Compras por mes (Egresos)
                                        </h3>
                                        {stats?.charts.purchases_by_month && stats.charts.purchases_by_month.length > 0 ? (
                                            <SalesChart data={stats.charts.purchases_by_month} />
                                        ) : (
                                            <div className="flex h-64 items-center justify-center text-slate-500">
                                                <p>No hay datos de compras disponibles</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comparativa Anual */}
                                {stats && (
                                    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6">
                                            Comparativa: Ingresos vs Egresos
                                        </h3>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            {/* Resumen Mes Actual */}
                                            <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                                                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Mes Actual</p>
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Ingresos (Ventas):</span>
                                                        <span className="font-bold text-green-700">{formatCurrency(stats.general.current_month_sales)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-green-200 pt-3">
                                                        <span className="text-sm text-slate-600">Egresos (Compras):</span>
                                                        <span className="font-bold text-orange-700">{formatCurrency(stats.general.current_month_purchases)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-green-100 rounded px-3 py-2">
                                                        <span className="text-sm font-semibold text-slate-700">Diferencia:</span>
                                                        <span className={`font-bold ${(stats.general.current_month_sales - stats.general.current_month_purchases) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                            {formatCurrency(stats.general.current_month_sales - stats.general.current_month_purchases)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Resumen Mes Anterior */}
                                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Mes Anterior</p>
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Ingresos (Ventas):</span>
                                                        <span className="font-bold text-green-700">{formatCurrency(stats.general.last_month_sales)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                                                        <span className="text-sm text-slate-600">Egresos (Compras):</span>
                                                        <span className="font-bold text-orange-700">{formatCurrency(stats.general.last_month_purchases)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-slate-200 rounded px-3 py-2">
                                                        <span className="text-sm font-semibold text-slate-700">Diferencia:</span>
                                                        <span className={`font-bold ${(stats.general.last_month_sales - stats.general.last_month_purchases) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                            {formatCurrency(stats.general.last_month_sales - stats.general.last_month_purchases)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Top productos */}
                                <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Productos más vendidos
                                    </h3>
                                    {stats?.charts.top_products && stats.charts.top_products.length > 0 ? (
                                        <TopProductsChart data={stats.charts.top_products} />
                                    ) : (
                                        <div className="flex h-64 items-center justify-center text-slate-500">
                                            <p>No hay datos de productos disponibles</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mensaje de próximos pasos */}
                                <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-dashed border-slate-300/80 bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
                                    <strong className="font-medium text-slate-800">💡 Consejos:</strong> Mantén tu inventario actualizado para mejores estadísticas.
                                    <Link to="/productos" className="ml-2 font-medium text-indigo-600 hover:underline">
                                        Gestionar productos →
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
                        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.04] lg:col-span-2">
                            <h2 className="text-lg font-semibold text-slate-900">API de autenticación</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Base típica en desarrollo:{' '}
                                <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                                    {import.meta.env.VITE_API_URL}
                                </code>
                            </p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                <EndpointCard method="POST" path="/auth/login" detail="Credenciales email + password" />
                                <EndpointCard method="POST" path="/auth/register" detail="Alta de usuario" />
                                <EndpointCard method="POST" path="/auth/refresh" detail="Renovar token (Axios)" />
                                <EndpointCard method="GET" path="/auth/me" detail="Usuario actual con JWT" />
                                <EndpointCard method="POST" path="/auth/logout" detail="Invalidar sesión" />
                            </div>
                        </section>

                        <section className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.04]">
                            <h2 className="text-lg font-semibold text-slate-900">Tu cuenta</h2>
                            <div className="mt-4 flex flex-1 flex-col justify-between rounded-xl border border-sky-100 bg-sky-50/80 p-4">
                                <p className="text-sm text-sky-950">
                                    Inicia sesión para acceder a rutas protegidas y datos reales del API.
                                </p>
                                <div className="mt-4 flex flex-col gap-2">
                                    <Link
                                        to="/login"
                                        className="inline-flex justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                                    >
                                        Crear cuenta
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Próximos pasos (solo para usuarios autenticados) */}
                {isAuthenticated && (
                    <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-dashed border-slate-300/80 bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
                        <strong className="font-medium text-slate-800">Próximos pasos:</strong> conectar listados a{' '}
                        <code className="rounded bg-slate-100 px-1 font-mono text-xs">GET /api/products</code>,{' '}
                        <code className="rounded bg-slate-100 px-1 font-mono text-xs">GET /api/clients</code> y{' '}
                        <code className="rounded bg-slate-100 px-1 font-mono text-xs">GET /api/sales</code> para completar la gestión.
                    </div>
                )}
            </div>
        </div>
    );
}
