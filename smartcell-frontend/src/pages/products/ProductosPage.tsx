import { useCallback, useEffect, useState } from 'react';
import {
  collectApiErrorMessages,
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '../../api/productsService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PageHeader } from '../../components/layout/PageHeader';
import { formatCurrency } from '../../utils/format';
import type {
  ApiProduct,
  LaravelPaginationMeta,
  ProductPayload,
  ProductTableRow,
} from '../../types/product';
import { PRODUCT_STATUS, PRODUCT_STATUS_LABELS } from '../../types/product';
import { ProductFormModal } from './ProductFormModal';
import { StockBadge } from './StockBadge';
import { ProductDetailModal } from './ProductDetailModal';

function mapProductRow(p: ApiProduct): ProductTableRow {
  const precio =
    typeof p.sale_price === 'string' ? parseFloat(p.sale_price) : Number(p.sale_price);
  return {
    id: p.id,
    sku: p.code,
    nombre: p.name,
    categoria: p.category,
    cantidad: p.quantity,
    precio: Number.isNaN(precio) ? 0 : precio,
    estado: p.status,
    _raw: p,
  };
}

export function ProductosPage() {
  const [rows, setRows] = useState<ProductTableRow[]>([]);
  const [meta, setMeta] = useState<LaravelPaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string[] | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    name: '',
    code: '',
    category: '',
    status: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiErrors, setFormApiErrors] = useState<string[]>([]);

  const loadProducts = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchProducts({
        page: p,
        per_page: 15,
        name: filters.name,
        code: filters.code,
        category: filters.category,
        status: filters.status,
      });
      setRows((res.data ?? []).map(mapProductRow));
      setMeta(res.meta ?? null);
    } catch (e) {
      setLoadError(collectApiErrorMessages(e));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts(page);
  }, [page, loadProducts]);

  function handleFilterChange(field: keyof typeof filters, value: string) {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset a la página 1 cuando cambia el filtro
  }

  function handleClearFilters() {
    setFilters({ name: '', code: '', category: '', status: '' });
    setPage(1);
  }

  const sinStockEnPagina = rows.filter(
    (r) => r.estado === PRODUCT_STATUS.SIN_STOCK || r.cantidad === 0,
  ).length;
  const stockBajoEnPagina = rows.filter((r) => {
    if (r.estado === PRODUCT_STATUS.SIN_STOCK || r.cantidad === 0) return false;
    return r.estado === PRODUCT_STATUS.STOCK_BAJO || (r.cantidad > 0 && r.cantidad < 10);
  }).length;

  const multiPage = meta && meta.last_page > 1;

  function openCreate() {
    setModalMode('create');
    setEditingProduct(null);
    setFormApiErrors([]);
    setModalOpen(true);
  }

  function openEdit(row: ProductTableRow) {
    setModalMode('edit');
    setEditingProduct(row._raw);
    setFormApiErrors([]);
    setModalOpen(true);
  }

  function openView(row: ProductTableRow) {
    setSelectedProduct(row._raw);
    setDetailOpen(true);
  }

  async function handleFormSubmit(payload: ProductPayload) {
    setFormSubmitting(true);
    setFormApiErrors([]);
    try {
      if (modalMode === 'create') {
        await createProduct(payload);
      } else if (editingProduct?.id != null) {
        const { code, ...updatePayload } = payload;
        void code;
        await updateProduct(editingProduct.id, updatePayload);
      }
      setModalOpen(false);
      await loadProducts(page);
    } catch (e) {
      setFormApiErrors(collectApiErrorMessages(e));
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(row: ProductTableRow) {
    if (!window.confirm(`¿Eliminar el producto «${row.nombre}»?`)) return;
    try {
      await deleteProduct(row.id);
      const res = await fetchProducts({ page, per_page: 15 });
      if ((res.data?.length ?? 0) === 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setRows((res.data ?? []).map(mapProductRow));
        setMeta(res.meta ?? null);
      }
    } catch (e) {
      window.alert(collectApiErrorMessages(e).join('\n'));
    }
  }

  const columns: Column<ProductTableRow>[] = [
    { key: 'sku', label: 'Código' },
    { key: 'nombre', label: 'Nombre', cellClassName: 'min-w-[10rem] font-medium text-slate-900' },
    { key: 'categoria', label: 'Categoría' },
    {
      key: 'cantidad',
      label: 'Cantidad',
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      render: (r) => r.cantidad,
    },
    {
      key: 'precio',
      label: 'P. venta',
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      render: (r) => formatCurrency(r.precio),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (r) => <StockBadge cantidad={r.cantidad} status={r.estado} />,
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-[1%]',
      cellClassName: 'text-right whitespace-nowrap',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openView(r)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100"
          >
            Ver
          </button>
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        eyebrow="Inventario"
        title="Productos"
        description="Alta, edición y baja de productos."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Nuevo producto
          </button>
        }
      />

      <div className="flex-1 p-6 sm:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Filtros */}
          <div className="grid gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Código
              </label>
              <input
                type="text"
                placeholder="Buscar por código..."
                value={filters.code}
                onChange={(e) => handleFilterChange('code', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Categoría
              </label>
              <input
                type="text"
                placeholder="Buscar por categoría..."
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {Object.values(filters).some(v => v) && (
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {loadError?.length ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <p className="font-medium">No se pudo cargar el listado</p>
              <ul className="mt-1 list-inside list-disc">
                {loadError.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Referencias</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {loading ? '—' : (meta?.total ?? rows.length)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sin stock</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-600">
                {loading ? '—' : sinStockEnPagina}
              </p>
              {multiPage ? (
                <p className="mt-1 text-[11px] text-slate-500">En esta página</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock bajo (&lt;10)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                {loading ? '—' : stockBajoEnPagina}
              </p>
              {multiPage ? (
                <p className="mt-1 text-[11px] text-slate-500">En esta página</p>
              ) : null}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-sm text-slate-500">Cargando productos…</p>
          ) : (
            <DataTable columns={columns} rows={rows} caption="Listado de productos" />
          )}

          {meta && meta.last_page >= 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
              <p className="text-sm text-slate-600">
                Mostrando {meta.from ?? 0}–{meta.to ?? 0} de {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-slate-600">
                  Página {meta.current_page} / {meta.last_page}
                </span>
                <button
                  type="button"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={() => !formSubmitting && setModalOpen(false)}
        onSubmit={handleFormSubmit}
        submitting={formSubmitting}
        apiErrors={formApiErrors}
      />
    </div>
  );
}
