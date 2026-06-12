import { useCallback, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  collectApiErrorMessages,
  createDeviceRepair,
  deleteDeviceRepair,
  fetchDeviceRepairs,
  updateDeviceRepair,
} from '../../api/deviceRepairsService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PageHeader } from '../../components/layout/PageHeader';
import type { LaravelPaginationMeta } from '../../types/product';
import type { ApiDeviceRepair, DeviceRepairPayload, DeviceRepairTableRow } from '../../types/deviceRepair';
import { clientDisplayName, technicianDisplayName, statusLabel } from '../../types/deviceRepair';
import { formatCurrency } from '../../utils/format';
import { ClientSearchSelect } from '../../components/ClientSearchSelect';
import { ModalScaffold } from '../../components/ModalScaffold';
import { Toast, type ToastProps } from '../../components/Toast';
import { DeviceRepairDetailModal } from './DeviceRepairDetailModal';
import { DeviceRepairFormModal } from './DeviceRepairFormModal';

function parseTotal(v: string | number): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function mapRepairRow(r: ApiDeviceRepair): DeviceRepairTableRow {
  return {
    id: r.id,
    codigo: r.repair_code,
    cliente: clientDisplayName(r.client ?? undefined),
    estado: statusLabel(r.status),
    tecnico: technicianDisplayName(r.technician ?? undefined),
    total: parseTotal(r.total_amount),
    boleta: r.receipt_number || '—',
    _raw: r,
  };
}

export function DeviceRepairsPage() {
  const [rows, setRows] = useState<DeviceRepairTableRow[]>([]);
  const [meta, setMeta] = useState<LaravelPaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string[] | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    repair_code: '',
    status: '',
    date_from: '',
    date_to: '',
    client_id: null as number | null,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRepair, setEditingRepair] = useState<ApiDeviceRepair | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiErrors, setFormApiErrors] = useState<string[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRepair, setDetailRepair] = useState<ApiDeviceRepair | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  const [toast, setToast] = useState<ToastProps | null>(null);

  const loadRepairs = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchDeviceRepairs({
        page: p,
        per_page: 15,
        repair_code: filters.repair_code,
        status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
        client_id: filters.client_id,
      });
      setRows((res.data ?? []).map(mapRepairRow));
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
    loadRepairs(page);
  }, [page, loadRepairs]);

  function handleFilterChange(field: keyof typeof filters, value: string | number | null) {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  }

  function handleClientFilterChange(clientId: number | null) {
    setFilters(prev => ({ ...prev, client_id: clientId }));
    setPage(1);
  }

  function handleClearFilters() {
    setFilters({ repair_code: '', status: '', date_from: '', date_to: '', client_id: null });
    setPage(1);
  }

  const multiPage = meta && meta.last_page > 1;

  function openExportModal() {
    setExportDateFrom(filters.date_from);
    setExportDateTo(filters.date_to);
    setExportModalOpen(true);
  }

  async function handleExportPdf() {
    const dateFrom = exportDateFrom;
    const dateTo = exportDateTo;

    const res = await fetchDeviceRepairs({
      page: 1,
      per_page: 1000,
      repair_code: filters.repair_code,
      status: filters.status,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      client_id: filters.client_id,
    });

    const exportRows = (res.data ?? []).map(mapRepairRow);
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Reporte de reparaciones', 14, 16);

    const periodoTexto = dateFrom || dateTo
      ? `Periodo: ${dateFrom || 'Inicio'} a ${dateTo || 'Hoy'}`
      : 'Periodo: Todo el historial';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 24);
    doc.text(periodoTexto, 14, 30);
    doc.text(`Total de registros mostrados: ${exportRows.length}`, 14, 36);

    autoTable(doc, {
      startY: 44,
      head: [['Código', 'Cliente', 'Estado', 'Técnico', 'Total', 'Boleta']],
      body: exportRows.map((row) => [
        row.codigo,
        row.cliente,
        row.estado,
        row.tecnico,
        formatCurrency(row.total),
        row.boleta,
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`reporte-reparaciones-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function openCreate() {
    setModalMode('create');
    setEditingRepair(null);
    setFormApiErrors([]);
    setModalOpen(true);
  }

  function openEdit(row: DeviceRepairTableRow) {
    setModalMode('edit');
    setEditingRepair(row._raw);
    setFormApiErrors([]);
    setModalOpen(true);
  }

  function openDetail(row: DeviceRepairTableRow) {
    setDetailRepair(row._raw);
    setDetailOpen(true);
  }

  async function handleFormSubmit(payload: DeviceRepairPayload) {
    setFormSubmitting(true);
    setFormApiErrors([]);
    try {
      let createdRepair: ApiDeviceRepair | null = null;

      if (modalMode === 'create') {
        createdRepair = await createDeviceRepair(payload);
      } else if (editingRepair?.id != null) {
        await updateDeviceRepair(editingRepair.id, payload);
      }

      setModalOpen(false);
      await loadRepairs(page);

      // Si se creó una nueva reparación, mostrar notificación y abrir detalle
      if (createdRepair) {
        setToast({
          type: 'success',
          title: `Nueva orden N° ${createdRepair.repair_code}`,
          message: `Reparación registrada exitosamente`,
          duration: 5000,
        });
        // Abrir detalle automáticamente
        setDetailRepair(createdRepair);
        setDetailOpen(true);
      }
    } catch (e) {
      setFormApiErrors(collectApiErrorMessages(e));
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(row: DeviceRepairTableRow) {
    if (!window.confirm(`¿Eliminar la reparación «${row.codigo}»?`)) return;
    try {
      await deleteDeviceRepair(row.id);
      const res = await fetchDeviceRepairs({
        page,
        per_page: 15,
        repair_code: filters.repair_code,
        status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
        client_id: filters.client_id,
      });
      if ((res.data?.length ?? 0) === 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setRows((res.data ?? []).map(mapRepairRow));
        setMeta(res.meta ?? null);
      }
    } catch (e) {
      window.alert(collectApiErrorMessages(e).join('\n'));
    }
  }

  const columns: Column<DeviceRepairTableRow>[] = [
    { key: 'codigo', label: 'Código', cellClassName: 'font-mono text-xs sm:text-sm' },
    { key: 'cliente', label: 'Cliente', cellClassName: 'min-w-[12rem]' },
    { key: 'estado', label: 'Estado', cellClassName: 'min-w-[10rem]' },
    { key: 'tecnico', label: 'Técnico Encargado', cellClassName: 'min-w-[10rem]' },
    {
      key: 'total',
      label: 'Total',
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums font-medium text-slate-900',
      render: (r) => formatCurrency(r.total),
    },
    { key: 'boleta', label: 'Boleta', cellClassName: 'font-mono text-xs sm:text-sm' },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-[1%]',
      cellClassName: 'text-right whitespace-nowrap',
      render: (r) => (
        <div className="flex flex-nowrap items-center justify-end gap-2">
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
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r)}
            className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100"
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
        eyebrow="Reparaciones"
        title="Reparaciones de Dispositivos"
        description="Registro de dispositivos en reparación."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openExportModal}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Nuevo servicio
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 sm:p-8">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Filtros */}
          <div className="grid gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Código de reparación
              </label>
              <input
                type="text"
                placeholder="Buscar por código..."
                value={filters.repair_code}
                onChange={(e) => handleFilterChange('repair_code', e.target.value)}
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
                <option value="recibido">Recibido</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="reparado">Reparado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <ClientSearchSelect
                id="filter-client"
                label="Cliente"
                value={filters.client_id}
                onChange={handleClientFilterChange}
              />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reparaciones</p>
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
            <p className="text-center text-sm text-slate-500">Cargando reparaciones…</p>
          ) : (
            <DataTable columns={columns} rows={rows} caption="Listado de reparaciones" />
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

      {exportModalOpen ? (
        <ModalScaffold onBackdropClick={() => setExportModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Exportar PDF por fechas</h3>
            <p className="mt-1 text-sm text-slate-500">Selecciona el rango de fechas para generar el reporte.</p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm text-slate-700">Fecha inicial
                <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </label>
              <label className="block text-sm text-slate-700">Fecha final
                <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setExportModalOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={async () => { setExportModalOpen(false); await handleExportPdf(); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Exportar PDF</button>
            </div>
          </div>
        </ModalScaffold>
      ) : null}

      {/* Modals */}
      <DeviceRepairFormModal
        mode={modalMode}
        initialRepair={editingRepair}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        submitting={formSubmitting}
        apiErrors={formApiErrors}
      />

      <DeviceRepairDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        repair={detailRepair}
      />

      {/* Toast de notificación */}
      {toast && (
        <Toast
          {...toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
