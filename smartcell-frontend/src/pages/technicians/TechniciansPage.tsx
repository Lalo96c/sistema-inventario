import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PageHeader } from '../../components/layout/PageHeader';
import { fetchTechnicians, createTechnician, updateTechnician, deleteTechnician, ApiTechnician, TechnicianPayload } from '../../api/techniciansApi';
import type { LaravelPaginationMeta } from '../../types/product';
import TechnicianForm from './TechnicianForm';
import { TechnicianDetailModal } from './TechnicianDetailModal';

type TechnicianTableRow = {
  id: number;
  nombre: string;
  dni: string;
  specialty: string;
  phone: string;
  status: string;
  _raw: ApiTechnician;
};

export default function TechniciansPage() {
  const [rows, setRows] = useState<TechnicianTableRow[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<LaravelPaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{
    name: string;
    dni: string;
    specialty: string;
    status: '' | 'activo' | 'inactivo';
  }>({ name: '', dni: '', specialty: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any | null>(null);
  const [editingTechnician, setEditingTechnician] = useState<ApiTechnician | null>(null);

  const loadTechnicians = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchTechnicians({
        page: pageNumber,
        per_page: 15,
        name: filters.name || undefined,
        dni: filters.dni || undefined,
        specialty: filters.specialty || undefined,
        status: filters.status || undefined,
      });

      setRows((response.data ?? []).map((technician) => ({
        id: technician.id,
        nombre: technician.name,
        dni: technician.dni,
        specialty: technician.specialty,
        phone: technician.phone || '—',
        status: technician.status,
        _raw: technician,
      })));

      setMeta(response.meta ?? null);
      setPage(response.meta?.current_page ?? pageNumber);
    } catch (error) {
      setLoadError('Error al cargar técnicos.');
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTechnicians(page);
  }, [page, loadTechnicians]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ name: '', dni: '', specialty: '', status: '' });
    setPage(1);
  };

  const openCreate = () => {
    setModalMode('create');
    setEditingTechnician(null);
    setModalOpen(true);
  };

  const openEdit = (technician: TechnicianTableRow) => {
    setModalMode('edit');
    setEditingTechnician(technician._raw);
    setModalOpen(true);
  };

  function openDetail(row: any) {
    setSelectedTechnician(row);
    setDetailOpen(true);
  }

  const handleFormSubmit = async (payload: TechnicianPayload) => {
    if (modalMode === 'create') {
      await createTechnician(payload);
    } else if (editingTechnician?.id) {
      await updateTechnician(editingTechnician.id, payload);
    }

    setModalOpen(false);
    await loadTechnicians(page);
  };

  const handleDelete = async (technician: TechnicianTableRow) => {
    if (!window.confirm(`¿Eliminar al técnico «${technician.nombre}»?`)) return;

    try {
      await deleteTechnician(technician.id);

      const response = await fetchTechnicians({
        page,
        per_page: 15,
        name: filters.name || undefined,
        dni: filters.dni || undefined,
        specialty: filters.specialty || undefined,
        status: filters.status || undefined,
      });

      if ((response.data?.length ?? 0) === 0 && page > 1) {
        setPage((value) => value - 1);
      } else {
        setRows((response.data ?? []).map((technician) => ({
          id: technician.id,
          nombre: technician.name,
          dni: technician.dni,
          specialty: technician.specialty,
          phone: technician.phone || '—',
          status: technician.status,
          _raw: technician,
        })));
        setMeta(response.meta ?? null);
      }
    } catch (error) {
      window.alert('Error al eliminar el técnico.');
    }
  };

  const columns: Column<TechnicianTableRow>[] = [
    { key: 'nombre', label: 'Nombre', cellClassName: 'min-w-[12rem] font-medium text-slate-900' },
    { key: 'dni', label: 'DNI', cellClassName: 'min-w-[9rem]' },
    { key: 'specialty', label: 'Especialidad', cellClassName: 'min-w-[12rem]' },
    { key: 'phone', label: 'Teléfono', cellClassName: 'min-w-[10rem]' },
    {
      key: 'status',
      label: 'Estado',
      cellClassName: 'min-w-[8rem]',
      render: (row) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status === 'activo'
            ? 'bg-green-100 text-green-800'
            : 'bg-slate-100 text-slate-800'
            }`}
        >
          {row.status === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-[1%]',
      cellClassName: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openDetail(row._raw)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100"
          >
            Ver
          </button>
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
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
        eyebrow="Técnicos"
        title="Gestión de técnicos"
        description="Administra técnicos, filtros y paginación con el mismo estilo de clientes."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Nuevo técnico
          </button>
        }
      />

      <div className="flex-1 p-6 sm:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 md:grid md:grid-cols-3 md:gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">DNI</label>
              <input
                type="text"
                placeholder="Buscar por DNI..."
                value={filters.dni}
                onChange={(e) => handleFilterChange('dni', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Especialidad</label>
              <input
                type="text"
                placeholder="Buscar por especialidad..."
                value={filters.specialty}
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            {(filters.name || filters.dni || filters.specialty || filters.status) && (
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
          {loading ? (
            <p className="text-center text-sm text-slate-500">Cargando tecnicos…</p>
          ) : (
            <DataTable columns={columns} rows={rows} caption="Listado de tecnicos" />
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
      <TechnicianDetailModal
        open={detailOpen}
        technician={selectedTechnician}
        onClose={() => setDetailOpen(false)}
      />
      {modalOpen && (
        <TechnicianForm
          title={modalMode === 'create' ? 'Nuevo técnico' : 'Editar técnico'}
          initialValues={editingTechnician ?? { name: '', dni: '', specialty: '', phone: '' }}
          onSubmit={handleFormSubmit}
          onClose={() => setModalOpen(false)}
        />

      )}

    </div>
  );
}
