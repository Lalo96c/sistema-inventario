import { useState, type FormEvent } from 'react';
import { ModalScaffold } from './ModalScaffold';
import type { ApiProduct, ProductPayload, ProductStatus } from '../types/product';
import { PRODUCT_STATUS, PRODUCT_STATUS_LABELS, statusFromQuantity } from '../types/product';
import { createProduct, collectApiErrorMessages } from '../api/productsService';

type FormState = {
    code: string;
    name: string;
    category: string;
    quantity: string;
    sale_price: string;
    status: ProductStatus;
};

type ValidationErrors = {
    code?: string;
    name?: string;
    category?: string;
    quantity?: string;
    sale_price?: string;
};

function emptyForm(): FormState {
    return {
        code: '',
        name: '',
        category: '',
        quantity: '0',
        sale_price: '',
        status: PRODUCT_STATUS.SIN_STOCK,
    };
}

function generateProductCode(): string {
    const timestamp = Date.now();
    const lastDigits = String(timestamp).slice(-5);
    return `PRD-${lastDigits}`;
}

function validateCode(value: string): string | undefined {
    if (!value.trim()) return 'El código es requerido';
    if (value.trim().length < 3) return 'El código debe tener al menos 3 caracteres';
    return undefined;
}

function validateName(value: string): string | undefined {
    if (!value.trim()) return 'El nombre es requerido';
    if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
    return undefined;
}

function validateCategory(value: string): string | undefined {
    if (!value.trim()) return 'La categoría es requerida';
    if (value.trim().length < 3) return 'La categoría debe tener al menos 3 caracteres';
    return undefined;
}

function validateQuantity(value: string): string | undefined {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return 'La cantidad debe ser un número mayor o igual a 0';
    return undefined;
}

function validateSalePrice(value: string): string | undefined {
    if (!value.trim()) return 'El precio de venta es requerido';
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return 'El precio debe ser mayor a 0';
    return undefined;
}

type QuickProductFormProps = {
    isOpen: boolean;
    onClose: () => void;
    onProductCreated: (product: ApiProduct) => void;
};

export function QuickProductForm({ isOpen, onClose, onProductCreated }: QuickProductFormProps) {
    const [form, setForm] = useState<FormState>(() => ({
        ...emptyForm(),
        code: generateProductCode(),
    }));
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiErrors, setApiErrors] = useState<string[]>([]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        // Validar antes de enviar
        const newErrors: ValidationErrors = {};
        const codeError = validateCode(form.code);
        const nameError = validateName(form.name);
        const categoryError = validateCategory(form.category);
        const quantityError = validateQuantity(form.quantity);
        const salePriceError = validateSalePrice(form.sale_price);

        if (codeError) newErrors.code = codeError;
        if (nameError) newErrors.name = nameError;
        if (categoryError) newErrors.category = categoryError;
        if (quantityError) newErrors.quantity = quantityError;
        if (salePriceError) newErrors.sale_price = salePriceError;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        setApiErrors([]);

        try {
            const quantity = parseInt(form.quantity, 10);
            const salePrice = parseFloat(form.sale_price);
            const status = statusFromQuantity(quantity);

            const payload: ProductPayload = {
                code: form.code.trim(),
                name: form.name.trim(),
                category: form.category.trim(),
                quantity,
                sale_price: salePrice,
                status,
            };

            const response = await createProduct(payload);

            // Callback con el producto creado
            onProductCreated(response);

            // Limpiar y cerrar
            setForm({ ...emptyForm(), code: generateProductCode() });
            setErrors({});
            onClose();
        } catch (error) {
            setApiErrors(collectApiErrorMessages(error));
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    return (
        <ModalScaffold onBackdropClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="quick-product-form-title"
                className="h-auto w-full max-w-lg shrink-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/15"
            >
                <h2 id="quick-product-form-title" className="text-lg font-semibold text-slate-900 mb-4">
                    Crear producto rápido
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Código */}
                    <div>
                        <label htmlFor="quick-product-code" className="block text-sm font-medium text-slate-700 mb-1">
                            Código
                        </label>
                        <input
                            id="quick-product-code"
                            type="text"
                            value={form.code}
                            onChange={(e) => {
                                setForm({ ...form, code: e.target.value });
                                if (errors.code) setErrors({ ...errors, code: undefined });
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${errors.code
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                                }`}
                        />
                        {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code}</p>}
                    </div>

                    {/* Nombre */}
                    <div>
                        <label htmlFor="quick-product-name" className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre
                        </label>
                        <input
                            id="quick-product-name"
                            type="text"
                            placeholder='Ej: Pantalla LCD 15"'
                            value={form.name}
                            onChange={(e) => {
                                setForm({ ...form, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: undefined });
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${errors.name
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                                }`}
                        />
                        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                    </div>

                    {/* Categoría */}
                    <div>
                        <label htmlFor="quick-product-category" className="block text-sm font-medium text-slate-700 mb-1">
                            Categoría
                        </label>
                        <input
                            id="quick-product-category"
                            type="text"
                            placeholder="Ej: Pantallas"
                            value={form.category}
                            onChange={(e) => {
                                setForm({ ...form, category: e.target.value });
                                if (errors.category) setErrors({ ...errors, category: undefined });
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${errors.category
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                                }`}
                        />
                        {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
                    </div>

                    {/* Cantidad */}
                    <div>
                        <label htmlFor="quick-product-quantity" className="block text-sm font-medium text-slate-700 mb-1">
                            Cantidad
                        </label>
                        <input
                            id="quick-product-quantity"
                            type="number"
                            min="0"
                            value={form.quantity}
                            onChange={(e) => {
                                setForm({ ...form, quantity: e.target.value });
                                if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${errors.quantity
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                                }`}
                        />
                        {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>}
                    </div>

                    {/* Precio de venta */}
                    <div>
                        <label htmlFor="quick-product-price" className="block text-sm font-medium text-slate-700 mb-1">
                            Precio de venta
                        </label>
                        <input
                            id="quick-product-price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={form.sale_price}
                            onChange={(e) => {
                                setForm({ ...form, sale_price: e.target.value });
                                if (errors.sale_price) setErrors({ ...errors, sale_price: undefined });
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${errors.sale_price
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                                }`}
                        />
                        {errors.sale_price && <p className="mt-1 text-xs text-rose-600">{errors.sale_price}</p>}
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {submitting ? 'Creando...' : 'Crear producto'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalScaffold>
    );
}
