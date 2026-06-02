import { useState, useRef, type FormEvent, useEffect } from 'react';
import { ClientSearchSelect } from '../../components/ClientSearchSelect';
import { QuickClientForm } from '../../components/QuickClientForm';
import { ModalScaffold } from '../../components/ModalScaffold';
import { ProductSearchSelect } from '../../components/ProductSearchSelect';
import type { ApiSale, SalePayload } from '../../types/sale';
import type { ApiClient } from '../../types/client';
import type { ApiProduct } from '../../types/product';
import { fetchNextSaleCode } from '../../api/salesService';
import { fetchProducts } from '../../api/productsService';

type LineForm = {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: string;
  unit_price: string;
  stock: number; // para mostrar stock disponible
};

type FormState = {
  sale_code: string;
  sale_date: string;
  client_id: number;
  lines: LineForm[];
};

function emptyLine(): LineForm {
  return { product_id: 0, product_name: '', product_code: '', quantity: '1', unit_price: '', stock: 0 };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): FormState {
  return { sale_code: '', sale_date: today(), client_id: 0, lines: [emptyLine()] };
}

function formFromSale(s: ApiSale): FormState {
  const lines =
    s.detail && s.detail.length > 0
      ? s.detail.map((d) => ({
        product_id: d.product_id,
        product_name: (d as any).product?.name ?? '',
        product_code: (d as any).product?.code ?? '',
        quantity: String(d.quantity),
        unit_price: String(d.unit_price),
        stock: (d as any).product?.quantity ?? 0,
      }))
      : [emptyLine()];
  return { sale_code: s.sale_code, sale_date: s.sale_date, client_id: s.client_id, lines };
}

// ─────────────────────────────────────────────────────────────────────────────
// Body del modal
// ─────────────────────────────────────────────────────────────────────────────
type BodyProps = {
  mode: 'create' | 'edit';
  initialSale: ApiSale | null;
  onClose: () => void;
  onSubmit: (payload: SalePayload) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

function SaleFormModalBody({ mode, initialSale, onClose, onSubmit, submitting, apiErrors }: BodyProps) {
  const [form, setForm] = useState<FormState>(() =>
    mode === 'edit' && initialSale ? formFromSale(initialSale) : emptyForm()
  );
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  // Escáner
  const [scanCode, setScanCode] = useState('');
  const [scanMsg, setScanMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  // Auto-código al crear
  useEffect(() => {
    if (mode === 'create') {
      setLoadingCode(true);
      fetchNextSaleCode()
        .then((code) => setForm((f) => ({ ...f, sale_code: code })))
        .finally(() => setLoadingCode(false));
    }
  }, [mode]);

  // Foco inicial al escáner
  useEffect(() => {
    const t = setTimeout(() => scanRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // ── Lógica de escaneo ────────────────────────────────────────────────────
  async function handleScanKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;

    // La pistola envía ' en lugar de -, normalizamos antes de buscar
    const raw = scanCode.trim().replace(/'/g, '-');
    if (!raw) return;

    setScanLoading(true);
    setScanMsg(null);

    try {
      // Buscamos con "search" (busca en nombre Y código) para mayor tolerancia
      const res = await fetchProducts({ search: raw, per_page: 20 });
      const products = res.data ?? [];

      // Coincidencia exacta primero (ignorando mayúsculas)
      const found =
        products.find((p) => p.code.toLowerCase() === raw.toLowerCase()) ??
        // Si no hay exacta, coincidencia parcial del código
        products.find((p) => p.code.toLowerCase().includes(raw.toLowerCase()));

      if (!found) {
        setScanMsg({ ok: false, text: `No existe producto con código "${raw}"` });
        setScanCode('');
        return;
      }

      if (found.quantity <= 0) {
        setScanMsg({ ok: false, text: `"${found.name}" no tiene stock disponible` });
        setScanCode('');
        return;
      }

      // ¿Ya está en la lista?
      const existIdx = form.lines.findIndex((l) => l.product_id === found.id);
      if (existIdx >= 0) {
        const newQty = parseInt(form.lines[existIdx].quantity || '1') + 1;
        if (newQty > found.quantity) {
          setScanMsg({ ok: false, text: `Stock insuficiente para "${found.name}" (máx ${found.quantity})` });
          setScanCode('');
          return;
        }
        setForm((f) => ({
          ...f,
          lines: f.lines.map((l, i) => i === existIdx ? { ...l, quantity: String(newQty) } : l),
        }));
        setScanMsg({ ok: true, text: `+1 a "${found.name}" → cantidad: ${newQty}` });
      } else {
        const newLine: LineForm = {
          product_id: found.id,
          product_name: found.name,
          product_code: found.code,
          quantity: '1',
          unit_price: String(found.sale_price),
          stock: found.quantity,
        };
        const emptyIdx = form.lines.findIndex((l) => l.product_id === 0);
        setForm((f) => {
          const lines = [...f.lines];
          if (emptyIdx >= 0) lines[emptyIdx] = newLine;
          else lines.push(newLine);
          return { ...f, lines };
        });
        setScanMsg({ ok: true, text: `✓ "${found.name}" agregado — stock: ${found.quantity}` });
      }

      setScanCode('');
      setTimeout(() => { scanRef.current?.focus(); }, 60);
    } catch {
      setScanMsg({ ok: false, text: 'Error al consultar el servidor. Intenta de nuevo.' });
    } finally {
      setScanLoading(false);
      // Limpiar el mensaje después de 4 s
      setTimeout(() => setScanMsg(null), 4000);
    }
  }

  // ── Helpers de líneas ────────────────────────────────────────────────────
  function setLine(i: number, patch: Partial<LineForm>) {
    setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  }

  function removeLine(i: number) {
    setForm((f) => {
      if (f.lines.length <= 1) return f;
      return { ...f, lines: f.lines.filter((_, j) => j !== i) };
    });
  }

  function handleProductSelect(i: number, product: ApiProduct | null) {
    if (!product) {
      setLine(i, emptyLine());
      return;
    }
    setLine(i, {
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      unit_price: String(product.sale_price),
      stock: product.quantity,
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.client_id) { window.alert('Selecciona un cliente.'); return; }
    const details = form.lines
      .filter((l) => l.product_id > 0)
      .map((l) => ({
        product_id: l.product_id,
        quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
        unit_price: parseFloat(String(l.unit_price).replace(',', '.')) || 0,
      }));
    if (details.length === 0) { window.alert('Añade al menos un producto.'); return; }
    await onSubmit({ sale_code: form.sale_code.trim(), sale_date: form.sale_date, client_id: form.client_id, details });
  }

  const total = form.lines.reduce((sum, l) => {
    return sum + (parseInt(l.quantity) || 0) * (parseFloat(l.unit_price) || 0);
  }, 0);

  const productCount = form.lines.filter((l) => l.product_id > 0).length;

  return (
    <ModalScaffold onBackdropClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="sale-modal-title"
        className="flex h-auto w-full max-w-3xl flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl"
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-slate-200 px-6 py-4">
          <h2 id="sale-modal-title" className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'Nueva venta' : 'Editar venta'}
          </h2>
          {apiErrors.length > 0 && (
            <ul className="mt-2 list-inside list-disc rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {apiErrors.map((msg) => <li key={msg}>{msg}</li>)}
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="px-6 py-4 space-y-5">

            {/* ── Código / Fecha / Cliente ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="sale-code" className="block text-sm font-medium text-slate-700">Código de venta</label>
                <input
                  id="sale-code" type="text" readOnly
                  value={loadingCode ? 'Generando...' : form.sale_code}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="sale-date" className="block text-sm font-medium text-slate-700">Fecha</label>
                <input
                  id="sale-date" type="date" required value={form.sale_date}
                  onChange={(e) => setForm((f) => ({ ...f, sale_date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <ClientSearchSelect
                      id="sale-client" label="" value={form.client_id}
                      onChange={(id) => setForm((f) => ({ ...f, client_id: id }))}
                    />
                  </div>
                  <button
                    type="button" onClick={() => setShowQuickClient(true)}
                    className="h-[38px] rounded-lg border border-indigo-300 bg-indigo-50 px-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 whitespace-nowrap flex-shrink-0"
                  >
                    + Cliente
                  </button>
                </div>
              </div>
            </div>

            {/* ── Zona escáner ── */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
                📷 Escáner de pistola
              </p>
              <input
                ref={scanRef}
                type="text"
                value={scanCode}
                onChange={(e) => { setScanCode(e.target.value); setScanMsg(null); }}
                onKeyDown={handleScanKey}
                placeholder="Apunta la pistola aquí y escanea el código de barras…"
                disabled={scanLoading}
                autoComplete="off" autoCorrect="off" spellCheck={false}
                className="w-full rounded-2xl border border-indigo-200 bg-white px-3 py-3 text-sm font-mono placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-60"
              />
              {scanLoading && (
                <p className="mt-2 text-xs text-indigo-500">Buscando producto…</p>
              )}
              {scanMsg && (
                <p className={`mt-2 text-xs font-medium rounded-md px-2 py-1.5 border ${scanMsg.ok
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                  {scanMsg.text}
                </p>
              )}
              <p className="mt-2 text-[11px] text-indigo-400">
                La pistola escribe el código y presiona Enter automáticamente. Si el producto ya está en la lista, suma +1 a la cantidad.
              </p>
            </div>

            {/* ── Detalle de productos ── */}
            <div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Detalle de la venta
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {productCount} producto{productCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button" onClick={addLine}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    + Agregar manual
                  </button>
                </div>

                <div className="space-y-3">
                  {form.lines.map((line, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 ${line.product_id > 0
                          ? 'border-slate-200 bg-white shadow-sm'
                          : 'border-dashed border-slate-200 bg-slate-50/70'
                        }`}
                    >
                      <div className="grid gap-3 sm:grid-cols-12 sm:items-end">

                        {/* Producto */}
                        <div className="sm:col-span-5">
                          {line.product_id > 0 ? (
                            // Producto ya seleccionado (por escáner o buscador)
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Producto</p>
                              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{line.product_name}</p>
                                  <p className="text-xs text-slate-400 font-mono">{line.product_code}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLine(i, emptyLine())}
                                  className="text-slate-300 hover:text-rose-500 flex-shrink-0 text-base leading-none"
                                  title="Cambiar producto"
                                >
                                  ✕
                                </button>
                              </div>
                              {line.stock > 0 && (
                                <p className={`text-[11px] mt-0.5 ${line.stock < 5 ? 'text-amber-600' : 'text-slate-400'}`}>
                                  Stock disponible: {line.stock}
                                </p>
                              )}
                            </div>
                          ) : (
                            // Buscador manual
                            <ProductSearchSelect
                              id={`product-line-${i}`}
                              label="Producto"
                              value={null}
                              onChange={(product) => handleProductSelect(i, product)}
                            />
                          )}
                        </div>

                        {/* Cantidad */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad</label>
                          <input
                            type="number" min={1}
                            max={line.stock > 0 ? line.stock : undefined}
                            required={line.product_id > 0}
                            value={line.quantity}
                            onChange={(e) => setLine(i, { quantity: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm tabular-nums text-center focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                          />
                        </div>

                        {/* Precio unitario */}
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1">P. unitario (S/)</label>
                          <input
                            type="number" min={0} step="0.01"
                            required={line.product_id > 0}
                            value={line.unit_price}
                            onChange={(e) => setLine(i, { unit_price: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm tabular-nums focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                          />
                        </div>

                        {/* Subtotal + quitar */}
                        <div className="sm:col-span-2 flex items-end justify-between gap-1 pb-0.5">
                          <span className="text-xs text-slate-400 tabular-nums">
                            = S/{' '}
                            {((parseInt(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            disabled={form.lines.length <= 1}
                            onClick={() => removeLine(i)}
                            className="text-xs font-medium text-rose-500 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                {productCount > 0 && (
                  <div className="mt-3 flex justify-end">
                    <div className="rounded-xl bg-slate-100 px-5 py-2.5 text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">S/ {total.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-3">
            <button
              type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : mode === 'create' ? 'Crear venta' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      <QuickClientForm
        isOpen={showQuickClient}
        onClose={() => setShowQuickClient(false)}
        onClientCreated={(c: ApiClient) => {
          setForm((f) => ({ ...f, client_id: c.id }));
          setShowQuickClient(false);
        }}
      />
    </ModalScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export principal
// ─────────────────────────────────────────────────────────────────────────────
type SaleFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialSale: ApiSale | null;
  onClose: () => void;
  onSubmit: (payload: SalePayload) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

export function SaleFormModal({ open, mode, initialSale, onClose, onSubmit, submitting, apiErrors }: SaleFormModalProps) {
  if (!open) return null;
  return (
    <SaleFormModalBody
      key={mode === 'edit' && initialSale ? `edit-${initialSale.id}` : 'create'}
      mode={mode} initialSale={initialSale} onClose={onClose}
      onSubmit={onSubmit} submitting={submitting} apiErrors={apiErrors}
    />
  );
}
