import { ModalScaffold } from '../../components/ModalScaffold';
import { formatCurrency } from '../../utils/format';
import type { ApiDeviceRepair, RepairImage } from '../../types/deviceRepair';
import { clientDisplayName, technicianDisplayName, statusLabel, AVAILABLE_TOOLS } from '../../types/deviceRepair';
import { getPublicUrl } from '../../api/config';
import { useState, useEffect } from 'react';

type DeviceRepairDetailModalProps = {
  open: boolean;
  repair: ApiDeviceRepair | null;
  onClose: () => void;
};

export function DeviceRepairDetailModal({ open, repair, onClose }: DeviceRepairDetailModalProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [images, setImages] = useState<RepairImage[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);

  // Cargar imágenes desde la API cuando se abre el modal
  useEffect(() => {
    if (!open || !repair) {
      setImages([]);
      return;
    }

    // Si la reparación ya tiene imágenes, usarlas
    if (repair.images && repair.images.length > 0) {
      console.log('Usando imágenes de repair.images:', repair.images);
      setImages(repair.images);
      return;
    }

    console.log('No hay imágenes en repair.images, intentando cargar de API...');

    // Si no, cargar desde la API - intentar con ID y UUID
    const loadImages = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;

        // Intentar primero con el ID numérico
        let response = await fetch(`${apiUrl}/images-repair/${repair.id}`);

        if (!response.ok) {
          console.warn(`No se encontraron imágenes con ID ${repair.id}, status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.images) && data.images.length > 0) {
          console.log('Imágenes cargadas de API:', data.images);
          setImages(data.images);
        } else {
          console.log('No hay imágenes en el servidor');
          setImages([]);
        }
      } catch (error) {
        console.error('Error cargando imágenes:', error);
        setImages([]);
      }
    };

    loadImages();
  }, [open, repair]);

  const handleOpenReceipt = () => {
    try {
      const publicUrl = getPublicUrl();
      const receiptUrl = `${publicUrl}/repair-receipt/${repair?.id}`;
      window.open(receiptUrl, '_blank');
    } catch (error) {
      console.error('Error al abrir comprobante:', error);
      alert('Error: Configuración no disponible');
    }
  };

  const handleOpenTicket = () => {
    try {
      const publicUrl = getPublicUrl();
      const ticketUrl = `${publicUrl}/repair-ticket/${repair?.id}`;
      window.open(ticketUrl, '_blank');
    } catch (error) {
      console.error('Error al abrir el ticket:', error);
      alert('Error: Configuración no disponible');
    }
  };

  const handleOpenPdf = () => {
    try {
      const publicUrl = getPublicUrl();
      const pdfUrl = `${publicUrl}/repair-receipt/${repair?.id}`;
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error al abrir el PDF:', error);
      alert('Error: Configuración no disponible');
    }
  };

  const handleSendPdfWhatsapp = () => {
    try {
      const publicUrl = getPublicUrl();
      const pdfUrl = `${publicUrl}/repair-receipt/${repair?.id}`;
      const message = `Comprobante de reparación: ${pdfUrl}`;
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } catch (error) {
      console.error('Error al compartir por WhatsApp:', error);
      alert('Error: Configuración no disponible');
    }
  };

  if (!open || !repair) return null;

  const total = typeof repair.total_amount === 'string'
    ? parseFloat(repair.total_amount)
    : repair.total_amount;

  return (
    <ModalScaffold onBackdropClick={onClose} zIndexClass="z-[60]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repair-detail-title"
        className="flex h-auto w-full max-w-2xl shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-slate-200 px-6 py-4">
          <h2 id="repair-detail-title" className="text-lg font-semibold text-slate-900">
            Reparación {repair.repair_code}
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p>
              <span className="font-medium text-slate-700">Estado: </span>
              <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {statusLabel(repair.status)}
              </span>
            </p>
            <p>
              <span className="font-medium text-slate-700">Cliente: </span>
              {clientDisplayName(repair.client ?? undefined)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Técnico: </span>
              {technicianDisplayName(repair.technician ?? undefined)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Total: </span>
              <span className="tabular-nums text-slate-900 font-medium">{formatCurrency(total)}</span>
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Tipo de dispositivo */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo de dispositivo</p>
            <p className="mt-1 text-sm text-slate-900">{repair.device_type ?? 'Otros'}</p>
          </div>

          {/* Bloqueo de pantalla */}
          {repair.device_lock && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bloqueo de pantalla</p>
              <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{repair.device_lock}</p>
            </div>
          )}

          {/* Dispositivo */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dispositivo</p>
            <p className="mt-1 text-sm text-slate-900">{repair.device_description}</p>
          </div>

          {/* Imágenes */}
          {images && images.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Imágenes de Reparación ({images.length})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageUrl(image.url)}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:border-indigo-300 transition-all"
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-24 w-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Ver</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Falla */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Falla Reportada</p>
            <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{repair.fault_description}</p>
          </div>

          {/* Boleta */}
          {repair.receipt_number && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Boleta</p>
              <p className="mt-1 text-sm font-mono text-slate-900">{repair.receipt_number}</p>
            </div>
          )}

          {/* Notas */}
          {repair.repair_notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notas Técnicas</p>
              <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{repair.repair_notes}</p>
            </div>
          )}

          {/* Herramientas utilizadas */}
          {repair.tools_used && repair.tools_used.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Herramientas Utilizadas</p>
              <div className="mt-3 space-y-2">
                {repair.tools_used.map((toolId: string) => {
                  const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
                  return tool ? (
                    <div key={toolId} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                        {tool.category === 'diagnostico' && '🔍'}
                        {tool.category === 'reparacion' && '🔧'}
                        {tool.category === 'limpieza' && '🧹'}
                        {tool.category === 'seguridad' && '⚡'}
                        {tool.category === 'otro' && '📦'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{tool.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{tool.category}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Fecha de entrega */}
          {repair.delivered_at && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha de Entrega</p>
              <p className="mt-1 text-sm text-slate-900">{repair.delivered_at}</p>
            </div>
          )}

          {/* Información financiera */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Información Financiera</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Estimado</p>
                <p className="mt-1 text-lg font-semibold text-blue-900">S/ {total.toFixed(2)}</p>
              </div>
              {repair.advance_amount && parseFloat(String(repair.advance_amount)) > 0 && (
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Anticipo</p>
                  <p className="mt-1 text-lg font-semibold text-green-900">S/ {parseFloat(String(repair.advance_amount)).toFixed(2)}</p>
                </div>
              )}
              <div className="rounded-lg bg-orange-50 p-3">
                <p className="text-xs font-medium text-orange-700 uppercase tracking-wider">Restante</p>
                <p className="mt-1 text-lg font-semibold text-orange-900">
                  S/ {Math.max(total - (repair.advance_amount ? parseFloat(String(repair.advance_amount)) : 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-slate-200 pt-4">
            <div className="grid gap-2 text-xs text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Registrado: </span>
                {repair.created_at}
              </p>
              {repair.updated_at && repair.updated_at !== repair.created_at && (
                <p>
                  <span className="font-medium text-slate-700">Actualizado: </span>
                  {repair.updated_at}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <button
              onClick={handleOpenTicket}
              className="group flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-4 transition-all hover:border-blue-300 hover:bg-blue-100"
            >
              <span className="text-3xl">🖨️</span>
              <span className="mt-2 text-sm font-medium text-blue-900">
                Ticket 80mm
              </span>
              <span className="text-xs text-blue-600">
                Impresión térmica
              </span>
            </button>

            <button
              onClick={handleOpenPdf}
              className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-slate-100"
            >
              <span className="text-3xl">📄</span>
              <span className="mt-2 text-sm font-medium text-slate-900">
                Comprobante
              </span>
              <span className="text-xs text-slate-500">
                Formato A4
              </span>
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para mostrar QR del comprobante */}
      {showQRModal && (
        <ModalScaffold
          onBackdropClick={() => setShowQRModal(false)}
          zIndexClass="z-[70]"
        >
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-2xl max-w-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Comprobante de Reparación
            </h3>
            <p className="text-sm text-slate-600 mb-4 text-center">
              Código: <span className="font-mono font-medium">{repair?.repair_code}</span>
            </p>

            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${getPublicUrl()}/repair-receipt/${repair?.id}`
                )}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleOpenReceipt}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                📄 Ver y Descargar Comprobante
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalScaffold>
      )}

      {/* Modal para ver imagen expandida */}
      {selectedImageUrl && (
        <ModalScaffold
          onBackdropClick={() => setSelectedImageUrl(null)}
          zIndexClass="z-[70]"
        >
          <div className="flex flex-col items-center justify-center p-4">
            <img
              src={selectedImageUrl}
              alt="Imagen expandida"
              className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </ModalScaffold>
      )}
    </ModalScaffold>
  );
}
