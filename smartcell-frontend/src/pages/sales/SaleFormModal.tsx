import { useState, type FormEvent, useEffect } from 'react';
import { ClientSearchSelect } from '../../components/ClientSearchSelect';
import { QuickClientForm } from '../../components/QuickClientForm';
import { ModalScaffold } from '../../components/ModalScaffold';
import type { ApiSale, SalePayload } from '../../types/sale';
import type { ApiClient } from '../../types/client';
import { ProductSearchSelect } from '../../components/ProductSearchSelect';
import { fetchNextSaleCode } from '../../api/salesService';

type LineForm = {
  product_id: number;
  quantity: string;
  unit_price: string;
};

type FormState = {
  sale_code: string;
  sale_date: string;
  client_id: number;
  lines: LineForm[];
};

function emptyLine(): LineForm {
  return { product_id: 0, quantity: '1', unit_price: '' };
}

function emptyForm(): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    sale_code: '',
    sale_date: today,
    client_id: 0,
    lines: [emptyLine()],
  };
}

function formFromSale(s: ApiSale): FormState {
  const lines =
    s.detail && s.detail.length > 0
      ? s.detail.map((d) => ({
        product_id: d.product_id,
        quantity: String(d.quantity),
        unit_price: String(d.unit_price),
      }))
      : [emptyLine()];
  return {
    sale_code: s.sale_code,
    sale_date: s.sale_date,
    client_id: s.client_id,
    lines,
  };
}

type SaleFormModalBodyProps = {
  mode: 'create' | 'edit';
  initialSale: ApiSale | null;
  onClose: () => void;
  onSubmit: (payload: SalePayload) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

function SaleFormModalBody({
  mode,
  initialSale,
  onClose,
  onSubmit,
  submitting,
  apiErrors,
}: SaleFormModalBodyProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === 'edit' && initialSale) {
      return formFromSale(initialSale);
    }
    return emptyForm();
  });

  const [showQuickClientForm, setShowQuickClientForm] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  // Actualizar formulario cuando cambien initialSale, el modo o se abra el modal
  useEffect(() => {
    if (mode === 'edit' && initialSale) {
      setForm(formFromSale(initialSale));
    } else if (mode === 'create') {
      setForm(emptyForm());
    }
  }, [initialSale, mode]);

  // Obtener el próximo código de venta del servidor (solo en modo create y cuando abre)
  useEffect(() => {
    if (mode === 'create' && !form.sale_code) {
      setLoadingCode(true);
      fetchNextSaleCode()
        .then((code) => {
          setForm((f) => ({
            ...f,
            sale_code: code,
          }));
        })
        .finally(() => {
          setLoadingCode(false);
        });
    }
  }, [mode]);

  function setLine(i: number, patch: Partial<LineForm>) {
    setForm((f) => {
      const lines = f.lines.map((line, j) => (j === i ? { ...line, ...patch } : line));
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  }

  function removeLine(index: number) {
    setForm((f) => {
      if (f.lines.length <= 1) return f;
      return { ...f, lines: f.lines.filter((_, j) => j !== index) };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      window.alert('Selecciona un cliente.');
      return;
    }
    const details = form.lines
      .filter((l) => l.product_id > 0)
      .map((l) => {
        const qty = Math.max(1, parseInt(l.quantity, 10) || 0);
        const unit = parseFloat(String(l.unit_price).replace(',', '.')) || 0;
        return { product_id: l.product_id, quantity: qty, unit_price: unit };
      });
    if (details.length === 0) {
      window.alert('Añade al menos un registro con producto.');
      return;
    }
    const payload: SalePayload = {
      sale_code: form.sale_code.trim(),
      sale_date: form.sale_date,
      client_id: form.client_id,
      details,
    };
    await onSubmit(payload);
  }

  // Manejar cliente creado en el formulario rápido
  function handleClientCreated(newClient: ApiClient) {
    setForm({ ...form, client_id: newClient.id });
    setShowQuickClientForm(false);
  }

  return (
    <ModalScaffold onBackdropClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-form-title"
        className="flex h-auto w-full max-w-3xl shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-slate-200 px-6 py-4">
          <h2 id="sale-form-title" className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'Nueva venta' : 'Editar venta'}
          </h2>
          {apiErrors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {apiErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <label htmlFor="sale-code" className="block text-sm font-medium text-slate-700">
                  Código de venta
                </label>
                <input
                  id="sale-code"
                  type="text"
                  readOnly
                  disabled={loadingCode}
                  value={form.sale_code || (loadingCode ? 'Cargando...' : '')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none cursor-not-allowed disabled:opacity-60"
                  title={mode === 'create' ? 'Generado automáticamente' : 'El código no se puede editar'}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {mode === 'create' 
                    ? 'Se genera automáticamente al guardar'
                    : 'El código no se puede editar'}
                </p>
              </div>
              <div>
                <label htmlFor="sale-date" className="block text-sm font-medium text-slate-700">
                  Fecha
                </label>
                <input
                  id="sale-date"
                  type="date"
                  required
                  value={form.sale_date}
                  onChange={(e) => setForm((f) => ({ ...f, sale_date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/30 focus:border-indigo-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cliente
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ClientSearchSelect
                      id="sale-client"
                      label=""
                      value={form.client_id}
                      onChange={(clientId) => setForm((f) => ({ ...f, client_id: clientId }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickClientForm(true)}
                    className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 whitespace-nowrap transition-colors h-10"
                    title="Crear nuevo cliente sin salir del formulario"
                  >
                    ➕ Crear cliente
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">Detalle de la venta</p>
                <button
                  type="button"
                  onClick={addLine}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Registro
                </button>
              </div>
              <div className="space-y-3">
                {form.lines.map((line, i) => (
                  <div
                    key={`line-${i}`}
                    className="grid gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-medium text-slate-600">Producto</label>
                      <div className="sm:col-span-5">
                        <ProductSearchSelect
                          id={`producto-${i}`}
                          label="Producto"
                          value={line.product_id || null}
                          onChange={(product) => {
                            if (!product) return;

                            setLine(i, {
                              product_id: product.id,
                              unit_price: String(product.sale_price),
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600">Cantidad</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={line.quantity}
                        onChange={(e) => setLine(i, { quantity: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-slate-600">P. unitario</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        value={line.unit_price}
                        onChange={(e) => setLine(i, { unit_price: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums"
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                      <button
                        type="button"
                        disabled={form.lines.length <= 1}
                        onClick={() => removeLine(i)}
                        className="text-xs font-medium text-rose-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : mode === 'create' ? 'Crear venta' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Formulario rápido para crear cliente */}
      <QuickClientForm
        isOpen={showQuickClientForm}
        onClose={() => setShowQuickClientForm(false)}
        onClientCreated={handleClientCreated}
      />
    </ModalScaffold>
  );
}

type SaleFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialSale: ApiSale | null;
  onClose: () => void;
  onSubmit: (payload: SalePayload) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

export function SaleFormModal(props: SaleFormModalProps) {
  const { open, mode, initialSale, onClose, onSubmit, submitting, apiErrors } = props;
  if (!open) return null;

  const instanceKey =
    mode === 'edit' && initialSale ? `edit-${initialSale.id}` : 'create';

  return (
    <SaleFormModalBody
      key={instanceKey}
      mode={mode}
      initialSale={initialSale}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      apiErrors={apiErrors}
    />
  );
}
