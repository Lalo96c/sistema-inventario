import { ModalScaffold } from '../../components/ModalScaffold';
import {
  INVENTORY_MOVEMENT_REASON_LABELS,
  INVENTORY_MOVEMENT_TYPE,
  INVENTORY_MOVEMENT_TYPE_LABELS,
} from '../../types/inventoryMovement';
import type { ApiInventoryMovement } from '../../types/inventoryMovement';

type Props = {
  open: boolean;
  movement: ApiInventoryMovement | null;
  onClose: () => void;
};

export function InventoryMovementDetailModal({
  open,
  movement,
  onClose,
}: Props) {
  if (!open || !movement) return null;

  return (
    <ModalScaffold onBackdropClick={onClose} zIndexClass="z-[60]">
      <div className="flex h-auto w-full max-w-2xl shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl">

        {/* HEADER */}
        <div className="shrink-0 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Movimiento #{movement.id}
          </h2>

          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p>
              <span className="font-medium text-slate-700">Producto: </span>
              {movement.product?.name ?? '—'}
            </p>

            <p>
              <span className="font-medium text-slate-700">Código: </span>
              {movement.product?.code ?? '—'}
            </p>

            <p>
              <span className="font-medium text-slate-700">Tipo: </span>

              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  movement.type === INVENTORY_MOVEMENT_TYPE.ENTRADA
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {INVENTORY_MOVEMENT_TYPE_LABELS[movement.type]}
              </span>
            </p>

            <p>
              <span className="font-medium text-slate-700">Cantidad: </span>
              {movement.quantity}
            </p>

            <p>
              <span className="font-medium text-slate-700">Motivo: </span>
              {INVENTORY_MOVEMENT_REASON_LABELS[movement.reason]}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha: </span>
              {movement.created_at
                ? new Date(movement.created_at).toLocaleString('es-PE')
                : '—'}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 py-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">
              Este movimiento registró una{' '}
              <span className="font-semibold">
                {INVENTORY_MOVEMENT_TYPE_LABELS[movement.type].toLowerCase()}
              </span>{' '}
              de{' '}
              <span className="font-semibold">
                {movement.quantity}
              </span>{' '}
              unidades para el producto{' '}
              <span className="font-semibold">
                {movement.product?.name ?? '—'}
              </span>.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-200 px-6 py-3">
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