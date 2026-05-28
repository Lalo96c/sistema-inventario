import { useEffect, useState, type FormEvent } from 'react';
import { ModalScaffold } from '../../components/ModalScaffold';
import { ProductSearchSelect } from '../../components/ProductSearchSelect';
import { QuickProductForm } from '../../components/QuickProductForm';
import { fetchNextPurchaseCode } from '../../api/purchasesService';
import type { Purchase } from '../../api/purchasesService';
import type { ApiProduct } from '../../types/product';

type PurchaseLineForm = {
  product_id: number;
  quantity: string;
  unit_price: string;
};

type PurchaseFormState = {
  purchase_code: string;
  purchase_date: string;
  supplier_name: string;
  lines: PurchaseLineForm[];
};

type Props = {
  mode: 'create' | 'edit';
  initialPurchase: Purchase | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

function emptyLine(): PurchaseLineForm {
  return { product_id: 0, quantity: '1', unit_price: '' };
}

function emptyForm(): PurchaseFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    purchase_code: '', // El código se cargará del backend
    purchase_date: today,
    supplier_name: '',
    lines: [emptyLine()],
  };
}

function formFromPurchase(p: Purchase): PurchaseFormState {
  const lines = (p.detail && p.detail.length > 0)
    ? p.detail.map((d) => ({
      product_id: d.product_id,
      quantity: String(d.quantity),
      unit_price: String(d.unit_price),
    }))
    : [emptyLine()];
  return {
    purchase_code: p.purchase_code,
    purchase_date: p.purchase_date,
    supplier_name: p.supplier_name,
    lines,
  };
}

export function PurchaseFormModal({
  mode,
  initialPurchase,
  open,
  onClose,
  onSubmit,
  submitting,
  apiErrors,
}: Props) {
  if (!open) return null;

  const [form, setForm] = useState<PurchaseFormState>(emptyForm());
  const [loadingCode, setLoadingCode] = useState(false);
  const [showQuickProductForm, setShowQuickProductForm] = useState(false);

  // Actualizar formulario cuando cambien initialPurchase, el modo o se abra el modal
  useEffect(() => {
    if (mode === 'edit' && initialPurchase) {
      setForm(formFromPurchase(initialPurchase));
    } else if (mode === 'create') {
      setForm(emptyForm());
    }
  }, [initialPurchase, mode, open]);

  // Obtener el próximo código de compra del servidor (solo en modo create y cuando abre)
  useEffect(() => {
    if (mode === 'create' && open && !form.purchase_code) {
      setLoadingCode(true);
      fetchNextPurchaseCode()
        .then((code) => {
          setForm((f) => ({
            ...f,
            purchase_code: code,
          }));
        })
        .finally(() => {
          setLoadingCode(false);
        });
    }
  }, [mode, open]);

  function setLine(i: number, patch: Partial<PurchaseLineForm>) {
    setForm((f) => {
      const lines = f.lines.map((line, j) =>
        j === i ? { ...line, ...patch } : line
      );
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm((f) => ({
      ...f,
      lines: [...f.lines, emptyLine()],
    }));
  }

  function removeLine(index: number) {
    setForm((f) => {
      if (f.lines.length <= 1) return f;
      return {
        ...f,
        lines: f.lines.filter((_, j) => j !== index),
      };
    });
  }

  // 🔥 Calcular total
  const total = form.lines.reduce((acc, l) => {
    const qty = parseInt(l.quantity) || 0;
    const price = parseFloat(l.unit_price) || 0;
    return acc + qty * price;
  }, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.supplier_name.trim()) {
      alert('Ingresa proveedor');
      return;
    }

    try {
      const details = form.lines
        .filter((l) => l.product_id > 0)
        .map((l) => {
          const qty = Math.max(1, parseInt(l.quantity) || 1);
          const price = parseFloat(l.unit_price);

          if (!price || price <= 0) {
            throw new Error('Precio inválido');
          }

          return {
            product_id: l.product_id,
            quantity: qty,
            unit_price: price,
          };
        });

      if (details.length === 0) {
        alert('Añade al menos un producto');
        return;
      }

      await onSubmit({
        purchase_code: form.purchase_code,
        purchase_date: form.purchase_date,
        supplier_name: form.supplier_name,
        details,
      });

    } catch (err: any) {
      alert(err.message || 'Error en el formulario');
    }
  }

  if (!open) return null;

  return (
    <ModalScaffold onBackdropClick={onClose}>
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border p-6">

        {/* HEADER */}
        <h2 className="text-lg font-semibold mb-4">
          {mode === 'create' ? 'Nueva compra' : 'Editar compra'}
        </h2>

        {apiErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
            <ul className="list-inside list-disc text-sm text-rose-700">
              {apiErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* CABECERA */}
          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
              <input
                type="text"
                readOnly
                disabled={loadingCode}
                value={form.purchase_code || (loadingCode ? 'Cargando...' : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition cursor-not-allowed disabled:opacity-60"
                title={mode === 'create' ? 'Generado automáticamente desde el servidor' : 'El código no se puede cambiar'}
              />
              <p className="mt-1 text-xs text-slate-500">
                {mode === 'create'
                  ? 'Se genera automáticamente al guardar'
                  : 'El código no se puede editar'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={form.purchase_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchase_date: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
              <input
                type="text"
                required
                placeholder="Nombre del proveedor"
                value={form.supplier_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier_name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition"
              />
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-6 space-y-3">

            <div className="flex justify-between items-center gap-2">
              <p className="text-sm font-medium text-slate-900">Productos</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
                >
                  + Agregar línea
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickProductForm(true)}
                  className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
                >
                  ➕ Crear producto
                </button>
              </div>
            </div>

            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">

                <div className="col-span-5">
                  <ProductSearchSelect
                    id={`p-${i}`}
                    label="Producto"
                    value={line.product_id || null}
                    onChange={(product) => {
                      if (!product) return;

                      setLine(i, {
                        product_id: product.id,
                        unit_price: '',
                      });
                    }}
                  />
                </div>

                <input
                  className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    setLine(i, { quantity: e.target.value })
                  }
                />

                <input
                  className="col-span-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Costo"
                  value={line.unit_price}
                  onChange={(e) =>
                    setLine(i, { unit_price: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="col-span-2 text-red-500 text-sm"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm font-medium text-slate-700">Total:</span>
            <span className="text-lg font-semibold text-slate-900">
              S/ {total.toFixed(2)}
            </span>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Guardando...' : (mode === 'create' ? 'Crear compra' : 'Actualizar compra')}
            </button>
          </div>

        </form>
      </div>
      {/* Formulario rápido para crear producto */}
      <QuickProductForm
        isOpen={showQuickProductForm}
        onClose={() => setShowQuickProductForm(false)}
        onProductCreated={() => {
          // El producto se agregará automáticamente al buscar en el ProductSearchSelect
          setShowQuickProductForm(false);
        }}
      />
    </ModalScaffold>
  );
}