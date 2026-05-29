import { useEffect, useState, type FormEvent } from 'react';
import { ModalScaffold } from '../../components/ModalScaffold';
import type { ApiProduct, ProductPayload, ProductStatus } from '../../types/product';
import {
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  statusFromQuantity,
} from '../../types/product';

type FormState = {
  code: string;
  name: string;
  category: string;
  quantity: number;
  sale_price: string;
  status: ProductStatus;
};

function generateProductCode(): string {
  const timestamp = Date.now();
  const lastDigits = String(timestamp).slice(-6);
  return `PRD-${lastDigits}`;
}

function emptyForm(): FormState {
  return {
    code: generateProductCode(),
    name: '',
    category: '',
    quantity: 0,
    sale_price: '',
    status: PRODUCT_STATUS.CON_STOCK,
  };
}

function formStateFromProduct(p: ApiProduct): FormState {
  const sp = p.sale_price;
  return {
    code: String(p.code ?? ''),
    name: String(p.name ?? ''),
    category: String(p.category ?? ''),
    quantity: Number(p.quantity ?? 0),
    sale_price: sp === '' || sp == null ? '' : String(sp),
    status: p.status ?? PRODUCT_STATUS.CON_STOCK,
  };
}

type ProductFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialProduct: ApiProduct | null;
  onClose: () => void;
  onSubmit: (payload: ProductPayload) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

type ProductFormModalBodyProps = Omit<ProductFormModalProps, 'open'>;

function ProductFormModalBody({
  mode,
  initialProduct,
  onClose,
  onSubmit,
  submitting,
  apiErrors,
}: ProductFormModalBodyProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === 'edit' && initialProduct) {
      return formStateFromProduct(initialProduct);
    }
    return emptyForm();
  });

  // Regenerar código automático en modo create
  useEffect(() => {
    if (mode === 'create') {
      setForm((f) => ({
        ...f,
        code: generateProductCode(),
      }));
    }
  }, [mode]);

  function handleQuantityChange(value: string) {
    const q = Number.parseInt(value, 10);
    const quantity = Number.isNaN(q) ? 0 : Math.max(0, q);
    setForm((f) => ({
      ...f,
      quantity,
      status: statusFromQuantity(quantity),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const sale = Number.parseFloat(String(form.sale_price).replace(',', '.'));
    const payload: ProductPayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      quantity: form.quantity,
      sale_price: Number.isNaN(sale) ? 0 : sale,
      status: form.status,
    };
    await onSubmit(payload);
  }

  return (
    <ModalScaffold onBackdropClick={onClose}>
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        
        {/* HEADER */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
        </h2>

        {/* ERRORES */}
        {apiErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
            <ul className="list-inside list-disc text-sm text-rose-700">
              {apiErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* CÓDIGO Y NOMBRE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-code" className="block text-sm font-medium text-slate-700 mb-1">
                Código
              </label>
              <div className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-slate-50 flex items-center cursor-not-allowed opacity-75">
                {form.code}
              </div>
            </div>
            <div>
              <label htmlFor="p-name" className="block text-sm font-medium text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                id="p-name"
                type="text"
                required
                maxLength={255}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition"
              />
            </div>
          </div>

          {/* CATEGORÍA */}
          <div>
            <label htmlFor="p-category" className="block text-sm font-medium text-slate-700 mb-1">
              Categoría *
            </label>
            <input
              id="p-category"
              type="text"
              required
              maxLength={255}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition"
            />
          </div>

          {/* CANTIDAD Y PRECIO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-qty" className="block text-sm font-medium text-slate-700 mb-1">
                Cantidad *
              </label>
              <input
                id="p-qty"
                type="number"
                min={0}
                required
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="p-price" className="block text-sm font-medium text-slate-700 mb-1">
                Precio venta (S/) *
              </label>
              <input
                id="p-price"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.sale_price}
                onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition"
              />
            </div>
          </div>

          {/* ESTADO */}
          <div>
            <label htmlFor="p-status" className="block text-sm font-medium text-slate-700 mb-1">
              Estado
            </label>
            <select
              id="p-status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition bg-white"
            >
              {(Object.entries(PRODUCT_STATUS_LABELS) as [ProductStatus, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
              {submitting ? 'Guardando…' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </ModalScaffold>
  );
}

export function ProductFormModal({
  open,
  mode,
  initialProduct,
  onClose,
  onSubmit,
  submitting,
  apiErrors,
}: ProductFormModalProps) {
  if (!open) return null;

  const instanceKey =
    mode === 'edit' && initialProduct ? `edit-${initialProduct.id}` : 'create';

  return (
    <ProductFormModalBody
      key={instanceKey}
      mode={mode}
      initialProduct={initialProduct}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      apiErrors={apiErrors}
    />
  );
}
