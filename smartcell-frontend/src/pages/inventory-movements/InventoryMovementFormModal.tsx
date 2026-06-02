import { useState, useRef, useEffect } from 'react';
import { ModalScaffold } from '../../components/ModalScaffold';
import type {
  ApiInventoryMovement,
  InventoryMovementPayload,
  InventoryMovementType,
  InventoryMovementReason,
} from '../../types/inventoryMovement';
import { ProductSearchSelect } from '../../components/ProductSearchSelect';
import { fetchProducts } from '../../api/productsService';
import type { ApiProduct } from '../../types/product';

type FormData = {
  product_id: string;
  product_name: string;
  product_code: string;
  current_stock: number;
  type: InventoryMovementType | '';
  quantity: string;
  reason: InventoryMovementReason | '';
};

function emptyFormData(): FormData {
  return { product_id: '', product_name: '', product_code: '', current_stock: 0, type: 'entrada', quantity: '', reason: 'compra' };
}

function formDataFromMovement(m: ApiInventoryMovement): FormData {
  return {
    product_id: m.product_id.toString(),
    product_name: m.product?.name ?? '',
    product_code: m.product?.code ?? '',
    current_stock: m.product?.quantity ?? 0,
    type: m.type,
    quantity: m.quantity.toString(),
    reason: m.reason,
  };
}

const MOTIVOS_ENTRADA = [
  { value: 'compra', label: 'Compra a proveedor' },
  { value: 'stock_inicial', label: 'Stock inicial' },
  { value: 'ajuste_positivo', label: 'Ajuste positivo' },
];
const MOTIVOS_SALIDA = [
  { value: 'venta', label: 'Venta' },
  { value: 'uso_tecnico', label: 'Uso en soporte técnico' },
  { value: 'ajuste_negativo', label: 'Ajuste negativo' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  movement: ApiInventoryMovement | null;
  onSubmit: (payload: InventoryMovementPayload) => void;
  submitting: boolean;
  apiErrors: string[];
  // Producto pre-seleccionado (viene del escaneo en la página)
  preselectedProduct?: ApiProduct | null;
};

type BodyProps = Omit<Props, 'open'>;

function InventoryMovementFormModalBody({ onClose, mode, movement, onSubmit, submitting, apiErrors, preselectedProduct }: BodyProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && movement) return formDataFromMovement(movement);
    if (preselectedProduct) {
      return {
        ...emptyFormData(),
        product_id: String(preselectedProduct.id),
        product_name: preselectedProduct.name,
        product_code: preselectedProduct.code,
        current_stock: preselectedProduct.quantity,
      };
    }
    return emptyFormData();
  });

  // ── Escáner ────────────────────────────────────────────────────────────────
  const [scanBuffer, setScanBuffer] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [movDate, setMovDate] = useState(today);

  // Foco automático al escáner si no hay producto pre-seleccionado
  useEffect(() => {
    if (!preselectedProduct && mode === 'create') {
      const t = setTimeout(() => scanRef.current?.focus(), 150);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => qtyRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, []);

  async function handleScanKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    // La pistola envía ' en lugar de -, normalizamos antes de buscar
    const code = scanBuffer.trim().replace(/'/g, '-');
    if (!code) return;

    setScanLoading(true);
    setScanFeedback(null);
    try {
      const res = await fetchProducts({ code, per_page: 10 });
      const product = (res.data ?? []).find(
        (p) => p.code.toLowerCase() === code.toLowerCase()
      );

      if (!product) {
        setScanFeedback({ type: 'err', msg: `No existe producto con código "${code}"` });
        setScanBuffer('');
        return;
      }

      setFormData((f) => ({
        ...f,
        product_id: String(product.id),
        product_name: product.name,
        product_code: product.code,
        current_stock: product.quantity,
      }));
      setScanBuffer('');
      setScanFeedback({ type: 'ok', msg: `✓ "${product.name}" encontrado — stock actual: ${product.quantity}` });
      setTimeout(() => qtyRef.current?.focus(), 80);
    } catch {
      setScanFeedback({ type: 'err', msg: 'Error al buscar el producto. Intenta de nuevo.' });
    } finally {
      setScanLoading(false);
    }
  }

  function clearProduct() {
    setFormData((f) => ({ ...f, product_id: '', product_name: '', product_code: '', current_stock: 0 }));
    setScanFeedback(null);
    setTimeout(() => scanRef.current?.focus(), 50);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: InventoryMovementPayload = {
      product_id: Number(formData.product_id),
      type: formData.type as InventoryMovementType,
      quantity: Number(formData.quantity),
      reason: formData.reason as InventoryMovementReason,
    };
    onSubmit(payload);
  }

  const motivos = formData.type === 'entrada' ? MOTIVOS_ENTRADA : MOTIVOS_SALIDA;
  const productSelected = !!formData.product_id;
  const qty = parseInt(formData.quantity) || 0;
  const projectedStock = formData.type === 'entrada'
    ? formData.current_stock + qty
    : formData.current_stock - qty;

  return (
    <ModalScaffold onBackdropClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'Registrar movimiento de inventario' : 'Editar movimiento'}
          </h2>
          {apiErrors.length > 0 && (
            <ul className="mt-2 list-inside list-disc rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {apiErrors.map((msg) => <li key={msg}>{msg}</li>)}
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* ── ESCÁNER ──────────────────────────────────────────────── */}
          {mode === 'create' && (
            <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-3">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                📷 Escanear código de barras
              </p>
              <input
                ref={scanRef}
                type="text"
                value={scanBuffer}
                onChange={(e) => { setScanBuffer(e.target.value); setScanFeedback(null); }}
                onKeyDown={handleScanKey}
                placeholder="Apunta la pistola y escanea…"
                disabled={scanLoading}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-mono placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-60"
              />
              {scanFeedback && (
                <p className={`mt-2 text-xs font-medium rounded-md px-2 py-1 ${scanFeedback.type === 'ok'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                  {scanFeedback.msg}
                </p>
              )}
            </div>
          )}

          {/* ── PRODUCTO ─────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Producto {mode === 'create' && <span className="text-xs text-slate-400">(escanea o busca)</span>}
            </label>

            {productSelected ? (
              /* Tarjeta del producto encontrado */
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{formData.product_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{formData.product_code}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stock actual: <span className={`font-semibold ${formData.current_stock <= 0 ? 'text-rose-600' : formData.current_stock < 10 ? 'text-amber-600' : 'text-green-700'}`}>
                      {formData.current_stock}
                    </span>
                  </p>
                </div>
                {mode === 'create' && (
                  <button type="button" onClick={clearProduct}
                    className="text-slate-400 hover:text-rose-500 text-sm" title="Cambiar producto">
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <ProductSearchSelect
                id="product_id" label="" value={Number(formData.product_id) || null}
                onChange={(p) => {
                  if (!p) return;
                  setFormData((f) => ({
                    ...f,
                    product_id: String(p.id),
                    product_name: p.name,
                    product_code: p.code,
                    current_stock: p.quantity,
                    reason: '',
                  }));
                  setTimeout(() => qtyRef.current?.focus(), 80);
                }}
              />
            )}
          </div>

          {/* ── TIPO ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {(['entrada', 'salida'] as InventoryMovementType[]).map((t) => (
              <button
                key={t} type="button"
                onClick={() => setFormData((f) => ({ ...f, type: t, reason: t === 'entrada' ? 'compra' : 'venta' }))}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${formData.type === t
                    ? t === 'entrada'
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : 'border-rose-400 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}>
                {t === 'entrada' ? '↓ Entrada' : '↑ Salida'}
              </button>
            ))}
          </div>

          {/* ── CANTIDAD + FECHA ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input
                ref={qtyRef}
                type="number" min="1" required
                value={formData.quantity}
                onChange={(e) => setFormData((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
              />
              {/* Stock proyectado */}
              {productSelected && qty > 0 && (
                <p className={`mt-1 text-xs font-medium ${projectedStock < 0 ? 'text-rose-600' : projectedStock < 10 ? 'text-amber-600' : 'text-green-700'
                  }`}>
                  Stock después: {projectedStock}
                  {projectedStock < 0 && ' ⚠ insuficiente'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input type="date" value={movDate} onChange={(e) => setMovDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" />
            </div>
          </div>

          {/* ── MOTIVO ───────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
            <div className="flex flex-wrap gap-2">
              {motivos.map((m) => (
                <button key={m.value} type="button"
                  onClick={() => setFormData((f) => ({ ...f, reason: m.value as InventoryMovementReason }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${formData.reason === m.value
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── BOTONES ──────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting || !productSelected || !formData.quantity || !formData.reason}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Guardando…' : mode === 'create' ? 'Registrar' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </ModalScaffold>
  );
}

export function InventoryMovementFormModal({ open, onClose, mode, movement, onSubmit, submitting, apiErrors, preselectedProduct }: Props) {
  if (!open) return null;
  return (
    <InventoryMovementFormModalBody
      key={mode === 'edit' && movement ? `edit-${movement.id}` : 'create'}
      onClose={onClose} mode={mode} movement={movement}
      onSubmit={onSubmit} submitting={submitting} apiErrors={apiErrors}
      preselectedProduct={preselectedProduct}
    />
  );
}
