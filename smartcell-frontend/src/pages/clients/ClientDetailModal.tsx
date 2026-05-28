import { ModalScaffold } from '../../components/ModalScaffold';
import type { ApiClient } from '../../types/client';

type ClientDetailModalProps = {
    open: boolean;
    client: ApiClient | null;
    onClose: () => void;
};

export function ClientDetailModal({
    open,
    client,
    onClose,
}: ClientDetailModalProps) {
    if (!open || !client) return null;

    return (
        <ModalScaffold onBackdropClick={onClose} zIndexClass="z-[60]">
            <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">

                {/* HEADER */}
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Cliente #{client.id}
                    </h2>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">

                        <p>
                            <span className="font-medium text-slate-700">DNI: </span>
                            {client.dni || '—'}
                        </p>

                        <p>
                            <span className="font-medium text-slate-700">Teléfono: </span>
                            {client.phone || '—'}
                        </p>

                        <p className="sm:col-span-2">
                            <span className="font-medium text-slate-700">Nombres: </span>
                            {client.first_name}
                        </p>

                        <p className="sm:col-span-2">
                            <span className="font-medium text-slate-700">Apellidos: </span>
                            {client.last_name}
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