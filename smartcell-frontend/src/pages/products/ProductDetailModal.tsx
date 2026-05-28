import { ModalScaffold } from '../../components/ModalScaffold';
import type { ApiProduct } from '../../types/product';
import { PRODUCT_STATUS_LABELS } from '../../types/product';

type ProductDetailModalProps = {
    open: boolean;
    product: ApiProduct | null;
    onClose: () => void;
};

export function ProductDetailModal({
    open,
    product,
    onClose,
}: ProductDetailModalProps) {
    if (!open || !product) return null;

    return (
        <ModalScaffold onBackdropClick={onClose} zIndexClass="z-[60]">
            <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">

                {/* HEADER */}
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Producto {product.code}
                    </h2>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                            <span className="font-medium text-slate-700">Nombre: </span>
                            {product.name}
                        </p>

                        <p>
                            <span className="font-medium text-slate-700">Categoría: </span>
                            {product.category}
                        </p>

                        <p>
                            <span className="font-medium text-slate-700">Cantidad: </span>
                            {product.quantity}
                        </p>

                        <p>
                            <span className="font-medium text-slate-700">Estado: </span>
                            {PRODUCT_STATUS_LABELS[product.status]}
                        </p>

                        <p className="sm:col-span-2">
                            <span className="font-medium text-slate-700">
                                Precio venta:
                            </span>{' '}
                            S/ {Number(product.sale_price).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-slate-200 px-6 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </ModalScaffold>
    );
}