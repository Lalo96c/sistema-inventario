import { ModalScaffold } from '../../components/ModalScaffold';
import type { TechnicianPayload } from '../../api/techniciansApi';

type TechnicianDetailModalProps = {
    open: boolean;
    technician: (TechnicianPayload & {
        id?: number;
    }) | null;
    onClose: () => void;
};

export function TechnicianDetailModal({
    open,
    technician,
    onClose,
}: TechnicianDetailModalProps) {
    if (!open || !technician) return null;

    return (
        <ModalScaffold onBackdropClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="technician-detail-title"
                className="flex h-auto w-full max-w-xl shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl"
            >
                {/* HEADER */}
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2
                        id="technician-detail-title"
                        className="text-lg font-semibold text-slate-900"
                    >
                        Detalle del Técnico
                    </h2>
                </div>

                {/* BODY */}
                <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Nombre
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                            {technician.name || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            DNI
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                            {technician.dni || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Especialidad
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                            {technician.specialty || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Teléfono
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                            {technician.phone || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Estado
                        </p>

                        <span
                            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${technician.status === 'activo'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                        >
                            {technician.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
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