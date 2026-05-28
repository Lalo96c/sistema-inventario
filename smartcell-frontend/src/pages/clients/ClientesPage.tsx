import { useCallback, useEffect, useState } from 'react';
import {
  collectApiErrorMessages,
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
} from '../../api/clientsService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PageHeader } from '../../components/layout/PageHeader';
import type {
  ApiClient,
  ClientPayload,
  ClientTableRow,
} from '../../types/client';
import { LaravelPaginationMeta } from '../../types/product';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailModal } from './ClientDetailModal';

function mapClientRow(c: ApiClient): ClientTableRow {
  return {
    id: c.id,
    dni: c.dni,
    nombre: `${c.first_name} ${c.last_name}`,
    phone: c.phone,
    _raw: c,
  };
}

export function ClientesPage() {
  const [rows, setRows] = useState<ClientTableRow[]>([]);
  const [meta, setMeta] = useState<LaravelPaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string[] | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    dni: '',
    first_name: '',
    last_name: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingClient, setEditingClient] = useState<ApiClient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ApiClient | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiErrors, setFormApiErrors] = useState<string[]>([]);

  const loadClients = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchClients({
        page: p,
        per_page: 15,
        dni: filters.dni,
        first_name: filters.first_name,
        last_name: filters.last_name,
      });

      setRows((res.data ?? []).map(mapClientRow));
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
    loadClients(page);
  }, [page, loadClients]);

  function handleFilterChange(field: keyof typeof filters, value: string) {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset a la página 1 cuando cambia el filtro
  }

  function handleClearFilters() {
    setFilters({ dni: '', first_name: '', last_name: '' });
    setPage(1);
  }

  // 🔥 MODAL
  function openCreate() {
    setModalMode('create');
    setEditingClient(null);
    setFormApiErrors([]);
    setModalOpen(true);
  }

  function openEdit(row: ClientTableRow) {
    setModalMode('edit');
    setEditingClient(row._raw);
    setFormApiErrors([]);
    setModalOpen(true);
  }
  function openView(row: ClientTableRow) {
    setSelectedClient(row._raw);
    setDetailOpen(true);
  }

  // 🔥 SUBMIT
  async function handleFormSubmit(payload: ClientPayload) {
    setFormSubmitting(true);
    setFormApiErrors([]);

    try {
      if (modalMode === 'create') {
        await createClient(payload);
      } else if (editingClient?.id) {
        await updateClient(editingClient.id, payload);
      }

      setModalOpen(false);
      await loadClients(page);
    } catch (e) {
      setFormApiErrors(collectApiErrorMessages(e));
    } finally {
      setFormSubmitting(false);
    }
  }

  // 🔥 DELETE
  async function handleDelete(row: ClientTableRow) {
    if (!window.confirm(`¿Eliminar al cliente «${row.nombre}»?`)) return;

    try {
      await deleteClient(row.id);

      const res = await fetchClients({
        page,
        per_page: 15,
        dni: filters.dni,
        first_name: filters.first_name,
        last_name: filters.last_name,
      });

      if ((res.data?.length ?? 0) === 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setRows((res.data ?? []).map(mapClientRow));
        setMeta(res.meta ?? null);
      }
    } catch (e) {
      window.alert(collectApiErrorMessages(e).join('\n'));
    }
  }

  // 🔥 COLUMNAS
  const columns: Column<ClientTableRow>[] = [
    { key: 'dni', label: 'DNI' },
    {
      key: 'nombre',
      label: 'Nombre completo',
      cellClassName: 'min-w-[10rem] font-medium text-slate-900',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      cellClassName: 'min-w-[10rem]',
      render: (r) => r.phone || '—',
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
        eyebrow="Clientes"
        title="Gestión de clientes"
        description="Registro y administración de clientes."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Nuevo cliente
          </button>
        }
      />

      <div className="flex-1 p-6 sm:p-8">
        {/* 🔥 MISMO WIDTH QUE PRODUCTOS */}
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Filtros */}
          <div className="grid gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                placeholder="Buscar por DNI..."
                value={filters.dni}
                onChange={(e) => handleFilterChange('dni', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={filters.first_name}
                onChange={(e) => handleFilterChange('first_name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                placeholder="Buscar por apellido..."
                value={filters.last_name}
                onChange={(e) => handleFilterChange('last_name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {Object.values(filters).some(v => v) && (
              <div className="md:col-span-3 flex justify-end">
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
              <p className="font-medium">No se pudo cargar clientes</p>
              <ul className="mt-1 list-disc list-inside">
                {loadError.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* 🔥 TARJETA RESUMEN (igual estilo que productos) */}
          <div className="grid gap-4 sm:grid-cols-1">
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total clientes
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {loading ? '—' : (meta?.total ?? rows.length)}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-sm text-slate-500">
              Cargando clientes…
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              caption="Listado de clientes"
            />
          )}

          {/* 🔥 PAGINACIÓN IGUAL QUE PRODUCTOS */}
          {meta && meta.last_page > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
              <p className="text-sm text-slate-600">
                Mostrando {meta.from ?? 0}–{meta.to ?? 0} de {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
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
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </div>

      <ClientFormModal
        open={modalOpen}
        mode={modalMode}
        initialClient={editingClient}
        onClose={() => !formSubmitting && setModalOpen(false)}
        onSubmit={handleFormSubmit}
        submitting={formSubmitting}
        apiErrors={formApiErrors}
      />
      <ClientDetailModal
        open={detailOpen}
        client={selectedClient}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}