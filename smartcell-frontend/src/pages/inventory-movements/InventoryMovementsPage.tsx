import { useCallback, useEffect, useState } from 'react';
import {
  collectApiErrorMessages,
  createInventoryMovement,
  deleteInventoryMovement,
  fetchInventoryMovements,
  updateInventoryMovement,
} from '../../api/inventoryMovementsService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PageHeader } from '../../components/layout/PageHeader';
import type {
  ApiInventoryMovement,
  LaravelPaginationMeta,
  InventoryMovementPayload,
  InventoryMovementTableRow,
} from '../../types/inventoryMovement';
import {
  INVENTORY_MOVEMENT_TYPE,
  INVENTORY_MOVEMENT_TYPE_LABELS,
  INVENTORY_MOVEMENT_REASON_LABELS,
  INVENTORY_MOVEMENT_REASON,
} from '../../types/inventoryMovement';
import { InventoryMovementFormModal } from './InventoryMovementFormModal';
import { InventoryMovementDetailModal } from './InventoryMovementDetailModal';

function mapMovementRow(m: ApiInventoryMovement): InventoryMovementTableRow {
  return {
    id: m.id,
    producto: m.product?.name || 'Producto desconocido',
    sku: m.product?.code || 'N/A',
    tipo: m.type,
    cantidad: m.quantity,
    motivo: m.reason,
    fecha: m.created_at ? new Date(m.created_at).toLocaleDateString('es-ES') : 'N/A',
    _raw: m,
  };
}

export function InventoryMovementsPage() {
  const [rows, setRows] = useState<InventoryMovementTableRow[]>([]);
  const [meta, setMeta] = useState<LaravelPaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string[] | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    type: '',
    reason: '',
    product_id: '',
    date_from: '',
    date_to: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingMovement, setEditingMovement] = useState<ApiInventoryMovement | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiErrors, setFormApiErrors] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<ApiInventoryMovement | null>(null);

  const loadMovements = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchInventoryMovements({
        page: p,
        per_page: 15,
        type: filters.type,
        reason: filters.reason,
        product_id: Number(filters.product_id) || undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      setRows((res.data ?? []).map(mapMovementRow));
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
    loadMovements(page);
  }, [page, loadMovements]);

  function handleFilterChange(field: keyof typeof filters, value: string) {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  }

  function handleClearFilters() {
    setFilters({
      type: '',
      reason: '',
      product_id: '',
      date_from: '',
      date_to: '',
    });
    setPage(1);
  }

  const multiPage = meta && meta.last_page > 1;

  function openCreate() {
    setModalMode('create');
    setEditingMovement(null);
    setFormApiErrors([]);
    setModalOpen(true);
  }

  function openEdit(row: InventoryMovementTableRow) {
    console.log('Editar movimiento', row);
    setModalMode('edit');
    setEditingMovement(row._raw);
    setFormApiErrors([]);
    setModalOpen(true);
  }
  function openDetail(row: InventoryMovementTableRow) {
    setSelectedMovement(row._raw);
    setDetailOpen(true);
  }

  async function handleFormSubmit(payload: InventoryMovementPayload) {
    setFormSubmitting(true);
    setFormApiErrors([]);
    try {
      if (modalMode === 'create') {
        await createInventoryMovement(payload);
      } else if (editingMovement?.id != null) {
        await updateInventoryMovement(editingMovement.id, payload);
      }
      setModalOpen(false);
      await loadMovements(page);
    } catch (e) {
      setFormApiErrors(collectApiErrorMessages(e));
    } finally {
      setFormSubmitting(false);

    }
  }

  async function handleDelete(row: InventoryMovementTableRow) {
    if (!window.confirm(`¿Eliminar el movimiento de ${row.producto}?`)) return;
    try {
      await deleteInventoryMovement(row.id);
      const res = await fetchInventoryMovements({ page, per_page: 15 });
      if ((res.data?.length ?? 0) === 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setRows((res.data ?? []).map(mapMovementRow));
        setMeta(res.meta ?? null);
      }
    } catch (e) {
      window.alert(collectApiErrorMessages(e).join('\n'));
    }
  }

  const columns: Column<InventoryMovementTableRow>[] = [
    {
      key: 'producto',
      label: 'Producto',
      cellClassName: 'min-w-[10rem] font-medium text-slate-900',
    },
    { key: 'sku', label: 'SKU' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.tipo === INVENTORY_MOVEMENT_TYPE.ENTRADA
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
            }`}
        >
          {INVENTORY_MOVEMENT_TYPE_LABELS[row.tipo]}
        </span>
      ),
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
    },
    {
      key: 'motivo',
      label: 'Motivo',
      render: (row) => INVENTORY_MOVEMENT_REASON_LABELS[row.motivo],
    },
    { key: 'fecha', label: 'Fecha' },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-[1%]',
      cellClassName: 'text-right whitespace-nowrap',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openDetail(r)}
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
        eyebrow='Inventario'
        title="Movimientos"
        description="Gestiona las entradas y salidas de productos"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Nuevo Movimiento
          </button>
        }
      />
      <div className="flex-1 p-6 sm:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Filtros */}
          <div className="grid gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 md:grid-cols-4">
            <div className="flex flex-col">
              <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                id="type-filter"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value={INVENTORY_MOVEMENT_TYPE.ENTRADA}>Entrada</option>
                <option value={INVENTORY_MOVEMENT_TYPE.SALIDA}>Salida</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="reason-filter" className="text-sm font-medium text-gray-700">
                Motivo
              </label>
              <select
                id="reason-filter"
                value={filters.reason}
                onChange={(e) => handleFilterChange('reason', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value={INVENTORY_MOVEMENT_REASON.VENTA}>Venta</option>
                <option value={INVENTORY_MOVEMENT_REASON.COMPRA}>Compra</option>
                <option value={INVENTORY_MOVEMENT_REASON.USO_TECNICO}>Uso Técnico</option>
                <option value={INVENTORY_MOVEMENT_REASON.AJUSTE_POSITIVO}>Ajuste (+)</option>
                <option value={INVENTORY_MOVEMENT_REASON.AJUSTE_NEGATIVO}>Ajuste (-)</option>
                <option value={INVENTORY_MOVEMENT_REASON.STOCK_INICIAL}>Stock Inicial</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="product-id-filter" className="text-sm font-medium text-gray-700">
                ID Producto
              </label>
              <input
                type="number"
                id="product-id-filter"
                value={filters.product_id}
                onChange={(e) => handleFilterChange('product_id', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="ID del producto"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="date-from-filter" className="text-sm font-medium text-gray-700">
                Desde
              </label>
              <input
                type="date"
                id="date-from-filter"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="date-to-filter" className="text-sm font-medium text-gray-700">
                Hasta
              </label>
              <input
                type="date"
                id="date-to-filter"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                Limpiar Filtros
              </button>
            </div>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Movimientos</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {loading ? '—' : (meta?.total ?? rows.length)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">En esta página</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">
                {loading ? '—' : rows.length}
              </p>
              {multiPage ? (
                <p className="mt-1 text-[11px] text-slate-500">Total global en la primera tarjeta</p>
              ) : null}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-sm text-slate-500">Cargando movimientos…</p>
          ) : (
            <DataTable columns={columns} rows={rows} caption="Listado de movimientos" />
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

      <InventoryMovementFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        movement={editingMovement}
        onSubmit={handleFormSubmit}
        submitting={formSubmitting}
        apiErrors={formApiErrors}
      />
      <InventoryMovementDetailModal
        open={detailOpen}
        movement={selectedMovement}
        onClose={() => setDetailOpen(false)}
      />
    </div >
  );
}