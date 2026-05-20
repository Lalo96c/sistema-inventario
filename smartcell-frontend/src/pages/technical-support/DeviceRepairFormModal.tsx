import { useState, type FormEvent, useEffect, useRef } from 'react';
import { ClientSearchSelect } from '../../components/ClientSearchSelect';
import { QuickClientForm } from '../../components/QuickClientForm';
import { TechnicianSearchSelect } from '../../components/TechnicianSearchSelect';
import { QuickTechnicianForm } from '../../components/QuickTechnicianForm';
import { TechnicianToolsModal } from '../../components/TechnicianToolsModal';
import { ModalScaffold } from '../../components/ModalScaffold';
import type { ApiDeviceRepair, DeviceRepairPayload, ApiTechnician, RepairImage } from '../../types/deviceRepair';
import type { ApiClient } from '../../types/client';
import { imageRepairService } from '../../api';
import { getPublicUrlAsync } from '../../api/config';
import { v4 as uuidv4 } from 'uuid';
import QRCodeStyling from 'qr-code-styling';

const DEVICE_TYPES = ['Celular', 'Laptop', 'Tablet', 'Computadora', 'Otros'] as const;
const LOCK_TYPES = ['PIN', 'Patrón', 'Contraseña', 'Otro', 'Sin bloqueo'] as const;

type DeviceType = (typeof DEVICE_TYPES)[number];
type LockType = (typeof LOCK_TYPES)[number];

const FAULT_OPTIONS_BY_DEVICE: Record<DeviceType, readonly string[]> = {
  Celular: [
    'Cambio de pantalla',
    'Batería',
    'Zócalo de carga',
    'Cámara',
    'Audio',
    'Micrófono',
    'No enciende',
    'Conectividad',
    'Otros',
  ],
  Laptop: [
    'No enciende',
    'Pantalla',
    'Teclado',
    'Trackpad',
    'Batería',
    'Cargador',
    'Sistema operativo',
    'Placa madre',
    'Otros',
  ],
  Tablet: [
    'Pantalla táctil',
    'Batería',
    'Carga',
    'Audio',
    'Cámara',
    'No enciende',
    'Wi-Fi',
    'Otros',
  ],
  Computadora: [
    'No enciende',
    'Fuente de poder',
    'Placa madre',
    'Disco duro',
    'RAM',
    'Pantalla',
    'Sistema operativo',
    'Red',
    'Otros',
  ],
  Otros: [
    'No enciende',
    'Falla general',
    'Conexión',
    'Hardware',
    'Software',
    'Otros',
  ],
};

type FormState = {
  repair_code: string;
  client_id: number;
  technician_id: number | null;
  device_type: string;
  device_description: string;
  device_lock_type: LockType | '';
  device_lock_value: string;
  fault_option: string;
  fault_description: string;
  status: 'recibido' | 'en_reparacion' | 'reparado' | 'entregado';
  total_amount: string;
  advance_amount: string;
  receipt_number: string;
  repair_notes: string;
  tools_used: string[];
};

function emptyForm(): FormState {
  return {
    repair_code: '',
    client_id: 0,
    technician_id: null,
    device_type: '',
    device_description: '',
    device_lock_type: '',
    device_lock_value: '',
    fault_option: '',
    fault_description: '',
    status: 'recibido',
    total_amount: '',
    advance_amount: '',
    receipt_number: '',
    repair_notes: '',
    tools_used: [],
  };
}

function formFromRepair(r: ApiDeviceRepair): FormState {
  // Detect if the stored fault_description matches a preset option
  const allFaultOptions = Object.values(FAULT_OPTIONS_BY_DEVICE).flat();
  const matchedOption = allFaultOptions.find(
    (opt) => opt !== 'Otros' && r.fault_description.startsWith(opt)
  );
  const faultOption = matchedOption ?? (r.fault_description ? 'Otros' : '');
  const faultDescription = matchedOption ? '' : r.fault_description;

  const lockRegex = /^([^:]+):\s*(.*)$/;
  const lockMatch = r.device_lock ? r.device_lock.match(lockRegex) : null;
  const device_lock_type = lockMatch ? (lockMatch[1] as LockType) : '';
  const device_lock_value = lockMatch ? lockMatch[2] : r.device_lock ?? '';

  return {
    repair_code: r.repair_code,
    client_id: r.client_id,
    technician_id: r.technician_id ?? null,
    device_type: r.device_type ?? 'Otros',
    device_description: r.device_description,
    device_lock_type,
    device_lock_value,
    fault_option: faultOption,
    fault_description: faultDescription,
    status: r.status,
    total_amount: String(r.total_amount),
    advance_amount: String(r.advance_amount ?? ''),
    receipt_number: r.receipt_number ?? '',
    repair_notes: r.repair_notes ?? '',
    tools_used: (r as any).tools_used ?? [],
  };
}

type DeviceRepairFormModalProps = {
  mode: 'create' | 'edit';
  initialRepair: ApiDeviceRepair | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: DeviceRepairPayload) => Promise<void>;
  submitting: boolean;
  apiErrors: string[];
};

export function DeviceRepairFormModal({
  mode,
  initialRepair,
  open,
  onClose,
  onSubmit,
  submitting,
  apiErrors,
}: DeviceRepairFormModalProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === 'edit' && initialRepair) {
      return formFromRepair(initialRepair);
    }
    return emptyForm();
  });

  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  // Mostrar/ocultar formulario rápido de cliente
  const [showQuickClientForm, setShowQuickClientForm] = useState(false);

  // Mostrar/ocultar formulario rápido de técnico
  const [showQuickTechnicianForm, setShowQuickTechnicianForm] = useState(false);

  // Mostrar/ocultar modal de herramientas del técnico
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [selectedTechnicianName, setSelectedTechnicianName] = useState('');

  // UUID para el repair_id en modo create
  const [repairUUID, setRepairUUID] = useState<string>('');

  // Imágenes obtenidas de la API
  const [images, setImages] = useState<RepairImage[]>([]);

  // Estados para editar imágenes
  const [editImages, setEditImages] = useState<RepairImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Polling interval
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref para el QR
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar formulario cuando cambien initialRepair, el modo o se abra el modal
  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialRepair) {
      setForm(formFromRepair(initialRepair));

      // Cargar imágenes de la reparación
      if (initialRepair.images && initialRepair.images.length > 0) {
        setEditImages(initialRepair.images);
      } else {
        setEditImages([]);
      }
    } else if (mode === 'create') {
      setForm(emptyForm());
      setEditImages([]);
    }
  }, [initialRepair, mode, open]);

  // Generar UUID cuando se abre el modal en modo "create"
  useEffect(() => {
    if (open && mode === 'create') {
      const uuid = uuidv4();
      setRepairUUID(uuid);
    }
  }, [open, mode]);

  // Polling a la API para obtener imágenes cada segundo
  useEffect(() => {
    if (!open || mode === 'edit' || !repairUUID) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      return;
    }

    const fetchImages = async () => {
      try {
        const backendUrl = await getPublicUrlAsync();
        const response = await fetch(`${backendUrl}/api/images-repair/${repairUUID}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.images)) {
            setImages(data.images);
          }
        }
      } catch (error) {
        // Silencioso - solo logging
        console.debug('Polling imágenes:', error);
      }
    };

    // Ejecutar inmediatamente
    fetchImages();

    // Polling cada segundo
    pollingIntervalRef.current = setInterval(fetchImages, 1000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [open, mode, repairUUID]);

  // Generar QR cuando repairUUID cambie
  useEffect(() => {
    if (!qrRef.current || !repairUUID || mode !== 'create') return;

    // Limpiar contenido anterior
    qrRef.current.innerHTML = '';

    const generateQR = async () => {
      try {
        const publicUrl = await getPublicUrlAsync();
        const qrCode = new QRCodeStyling({
          width: 160,
          height: 160,
          data: `${publicUrl}/images-repair-form/${repairUUID}`,
          margin: 10,
          type: 'svg',
          dotsOptions: {
            color: '#667eea',
            type: 'square',
          },
          backgroundOptions: {
            color: '#ffffff',
          },
        });

        if (qrRef.current) {
          qrCode.append(qrRef.current);
        }
      } catch (error) {
        console.error('Error al generar QR:', error);
      }
    };

    generateQR();
  }, [repairUUID, mode]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      window.alert('Selecciona un cliente.');
      return;
    }
    if (!form.device_type) {
      window.alert('Selecciona un tipo de dispositivo.');
      return;
    }
    if (!form.device_description.trim()) {
      window.alert('Describe el dispositivo.');
      return;
    }
    if (!form.fault_option) {
      window.alert('Selecciona un tipo de falla.');
      return;
    }
    if (form.fault_option === 'Otros' && !form.fault_description.trim()) {
      window.alert('Describe la falla en el campo "Descripción personalizada".');
      return;
    }

    const finalFaultDescription =
      form.fault_option === 'Otros' ? form.fault_description.trim() : form.fault_option;

    const deviceLockValue = form.device_lock_value.trim();
    const combinedDeviceLock =
      form.device_lock_type && form.device_lock_type !== 'Sin bloqueo' && deviceLockValue
        ? `${form.device_lock_type}: ${deviceLockValue}`
        : undefined;

    const payload: DeviceRepairPayload = {
      client_id: form.client_id,
      technician_id: form.technician_id ?? undefined,
      device_type: form.device_type,
      device_description: form.device_description.trim(),
      device_lock: combinedDeviceLock,
      fault_description: finalFaultDescription,
      status: form.status,
      total_amount: parseFloat(form.total_amount) || 0,
      advance_amount: parseFloat(form.advance_amount) || undefined,
      repair_notes: form.repair_notes.trim() || undefined,
      images: mode === 'create' && images.length > 0 ? images : mode === 'edit' && editImages.length > 0 ? editImages : undefined,
      tools_used: form.tools_used.length > 0 ? form.tools_used : undefined,
    };
    await onSubmit(payload);
  }

  async function handleUploadImage(file: File) {
    if (!initialRepair?.id) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/images-repair/${initialRepair.id}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        // Agregar imagen a la lista
        setEditImages([...editImages, {
          name: data.file_name,
          path: data.path,
          url: data.url,
        }]);
      } else {
        alert('Error al subir imagen: ' + data.message);
      }
    } catch (error) {
      alert('Error al subir imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteImage(imageName: string) {
    if (!initialRepair?.id) return;
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      // URL-encode el nombre del archivo para caracteres especiales
      const encodedFileName = encodeURIComponent(imageName);
      const response = await fetch(`${apiUrl}/images-repair/${initialRepair.id}/${encodedFileName}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setEditImages(editImages.filter(img => img.name !== imageName));
      } else {
        alert('Error al eliminar imagen: ' + data.message);
      }
    } catch (error) {
      alert('Error al eliminar imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  // Manejar cliente creado en el formulario rápido
  function handleClientCreated(newClient: ApiClient) {
    setForm({ ...form, client_id: newClient.id });
    setShowQuickClientForm(false);
  }

  // Manejar técnico creado en el formulario rápido
  function handleTechnicianCreated(newTechnician: ApiTechnician) {
    setForm({ ...form, technician_id: newTechnician.id });
    setShowQuickTechnicianForm(false);
  }

  // Manejar selección de técnico - abrir modal de herramientas
  function handleTechnicianSelected(technicianId: number | null) {
    setForm({ ...form, technician_id: technicianId });

    if (technicianId && mode === 'edit') {
      // Obtener nombre del técnico para mostrar en el modal
      // Por ahora usamos un placeholder, idealmente vendría del backend
      setSelectedTechnicianName(`Técnico #${technicianId}`);
      setShowToolsModal(true);
    }
  }

  // Manejar guardado de herramientas seleccionadas
  function handleToolsSave(toolIds: string[]) {
    setForm({ ...form, tools_used: toolIds });
  }

  // Manejar cierre del modal - limpiar imágenes huérfanas si es modo "create"
  async function handleClose() {
    if (mode === 'create' && repairUUID) {
      try {
        await imageRepairService.deleteRepairFolder(repairUUID);
      } catch (error) {
        console.error('Error limpiando imágenes huérfanas:', error);
      }
    }
    onClose();
  }

  return (
    <ModalScaffold onBackdropClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repair-form-title"
        className="flex h-auto w-full max-w-2xl shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-slate-200 px-6 py-4">
          <h2 id="repair-form-title" className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'Nuevo servicio de reparación' : 'Editar reparación'}
          </h2>
          {apiErrors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {apiErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* QR y UUID en modo create */}
            {mode === 'create' && repairUUID && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3">
                  Carga de imágenes
                </h3>
                <div className="flex flex-col items-center gap-4">
                  {/* QR Code Container */}
                  <div
                    ref={qrRef}
                    className="flex justify-center p-3 bg-white rounded-lg border border-indigo-300"
                  />

                  {/* ID */}
                  <div className="text-center w-full">
                    <p className="text-xs text-indigo-600 mb-2">ID de reparación:</p>
                    <p className="text-xs text-indigo-900 font-mono bg-white px-3 py-2 rounded border border-indigo-300 break-all">
                      {repairUUID}
                    </p>
                  </div>

                  {/* Instrucción */}
                  <p className="text-xs text-indigo-700 text-center">
                    Escanea el QR con tu teléfono para cargar imágenes
                  </p>
                </div>
              </div>
            )}

            {/* Imágenes en modo EDICIÓN */}
            {mode === 'edit' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Imágenes ({editImages.length})
                </h3>

                {editImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
                    {editImages.map((image) => (
                      <div key={image.name} className="relative group">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-24 object-cover rounded border border-blue-200 group-hover:opacity-75"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.name)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadImage(e.target.files[0]);
                    }
                  }}
                  disabled={uploadingImage}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {uploadingImage ? '📤 Subiendo...' : '📷 Agregar imagen'}
                </button>
              </div>
            )}
            {/* Imágenes cargadas */}
            {images.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-3">
                  Imágenes cargadas ({images.length})
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {images.map((image) => (
                    <div key={image.name} className="relative group">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover rounded border border-green-200"
                        loading="lazy"
                      />

                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Código de reparación */}
            <div>
              <label htmlFor="repair-code" className="block text-sm font-medium text-slate-700">
                Código de reparación
              </label>
              <input
                id="repair-code"
                maxLength={64}
                type="text"
                placeholder={mode === 'create' ? 'Se asigna automáticamente al guardar' : 'Ej: REP-001'}
                value={form.repair_code}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                El código se genera automáticamente y no se puede editar.
              </p>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cliente *
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ClientSearchSelect
                    id="repair-client"
                    label=""
                    value={form.client_id}
                    onChange={(clientId) => setForm({ ...form, client_id: clientId })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickClientForm(true)}
                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 whitespace-nowrap transition-colors h-10"
                  title="Crear nuevo cliente sin salir del formulario"
                >
                  ➕ Crear cliente
                </button>
              </div>
            </div>

            {/* Técnico - solo en editar */}
            {mode === 'edit' && (
              <div>
                <label htmlFor="technician" className="block text-sm font-medium text-slate-700">
                  Técnico
                </label>
                <div className="mt-1 flex gap-2">
                  <div className="flex-1">
                    <TechnicianSearchSelect
                      value={form.technician_id}
                      onChange={handleTechnicianSelected}
                      placeholder="Buscar técnico..."
                      isDisabled={loadingTechnicians}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickTechnicianForm(true)}
                    className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 whitespace-nowrap transition-colors h-10"
                    title="Crear nuevo técnico sin salir del formulario"
                  >
                    ➕ Crear técnico
                  </button>
                </div>
              </div>
            )}

            {/* Tipo de dispositivo */}
            <div>
              <label htmlFor="device-type" className="block text-sm font-medium text-slate-700">
                Tipo de dispositivo *
              </label>
              <select
                id="device-type"
                value={form.device_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    device_type: e.target.value,
                    fault_option: '',
                    fault_description: '',
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Selecciona el tipo de dispositivo...</option>
                {DEVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Dispositivo */}
            <div>
              <label htmlFor="device" className="block text-sm font-medium text-slate-700">
                Dispositivo *
              </label>
              <input
                id="device"
                required
                type="text"
                placeholder="Ej: Samsung Galaxy A12"
                value={form.device_description}
                onChange={(e) => setForm({ ...form, device_description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Bloqueo de pantalla */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Bloqueo de pantalla
              </label>

              <div className="mt-1 grid gap-3 sm:grid-cols-[1fr,2fr]">
                <select
                  id="device-lock-type"
                  value={form.device_lock_type}
                  onChange={(e) => {
                    const newType = e.target.value as LockType | '';
                    setForm({
                      ...form,
                      device_lock_type: newType,
                      device_lock_value: newType === 'Sin bloqueo' ? '' : form.device_lock_value,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Tipo de bloqueo...</option>
                  {LOCK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <input
                  id="device-lock-value"
                  type="text"
                  maxLength={128}
                  disabled={!form.device_lock_type || form.device_lock_type === 'Sin bloqueo'}
                  placeholder={
                    form.device_lock_type === 'PIN'
                      ? 'Ej: 1234'
                      : form.device_lock_type === 'Patrón'
                        ? 'Ej: 1-&gt;2-&gt;5-&gt;9-&gt;8 (numeración de puntos)'
                        : form.device_lock_type === 'Contraseña'
                          ? 'Ej: miPass2026'
                          : form.device_lock_type === 'Otro'
                            ? 'Describe el bloqueo...'
                            : 'Selecciona el tipo de bloqueo primero'
                  }
                  value={form.device_lock_value}
                  onChange={(e) => setForm({ ...form, device_lock_value: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Para Patrón: numera los puntos del 1 al 9 (como un teclado numérico) y describe la secuencia (ej: 1-&gt;2-&gt;5-&gt;9-&gt;8).
              </p>
            </div>

            {/* Falla */}
            <div>
              <label htmlFor="fault-select" className="block text-sm font-medium text-slate-700">
                Descripción de la falla *
              </label>
              <select
                id="fault-select"
                value={form.fault_option}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fault_option: e.target.value,
                    fault_description: e.target.value !== 'Otros' ? '' : form.fault_description,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Selecciona el tipo de falla...</option>
                {(form.device_type ? FAULT_OPTIONS_BY_DEVICE[form.device_type as DeviceType] : []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {form.device_type === '' && (
                <p className="mt-2 text-xs text-slate-500">
                  Elige primero un tipo de dispositivo para ver las fallas predeterminadas.
                </p>
              )}

              {/* Campo de texto libre solo si seleccionó "Otros" */}
              {form.fault_option === 'Otros' && (
                <div className="mt-3">
                  <label htmlFor="fault-custom" className="block text-sm font-medium text-slate-600">
                    Descripción personalizada *
                  </label>
                  <textarea
                    id="fault-custom"
                    rows={3}
                    placeholder="Describe con detalle el problema que tiene el dispositivo..."
                    value={form.fault_description}
                    onChange={(e) => setForm({ ...form, fault_description: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="recibido">Recibido</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="reparado">Reparado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>

            {/* Total */}
            <div>
              <label htmlFor="total" className="block text-sm font-medium text-slate-700">
                Total estimado
              </label>
              <input
                id="total"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Anticipo */}
            <div>
              <label htmlFor="advance" className="block text-sm font-medium text-slate-700">
                Anticipo
              </label>
              <input
                id="advance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.advance_amount}
                onChange={(e) => setForm({ ...form, advance_amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Restante calculado */}
            {(parseFloat(form.total_amount) > 0 || parseFloat(form.advance_amount) > 0) && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Restante
                </label>
                <div className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  S/ {Math.max((parseFloat(form.total_amount) || 0) - (parseFloat(form.advance_amount) || 0), 0).toFixed(2)}
                </div>
              </div>
            )}

            {/* Boleta */}
            <div>
              <label htmlFor="receipt" className="block text-sm font-medium text-slate-700">
                Boleta
              </label>
              <input
                id="receipt"
                type="text"
                maxLength={64}
                placeholder={mode === 'create' ? 'Se asigna automáticamente al guardar' : 'Número de boleta'}
                value={form.receipt_number}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                El número de boleta será generado automáticamente y no puede editarse.
              </p>
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                Notas
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Notas adicionales sobre la reparación..."
                value={form.repair_notes}
                onChange={(e) => setForm({ ...form, repair_notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Formulario rápido para crear cliente */}
      <QuickClientForm
        isOpen={showQuickClientForm}
        onClose={() => setShowQuickClientForm(false)}
        onClientCreated={handleClientCreated}
      />
      {/* Formulario rápido para crear técnico */}
      <QuickTechnicianForm
        isOpen={showQuickTechnicianForm}
        onClose={() => setShowQuickTechnicianForm(false)}
        onTechnicianCreated={handleTechnicianCreated}
      />
      {/* Modal de herramientas utilizadas por el técnico */}
      <TechnicianToolsModal
        isOpen={showToolsModal}
        onClose={() => setShowToolsModal(false)}
        onSave={handleToolsSave}
        initialTools={form.tools_used}
        technicianName={selectedTechnicianName}
      />
    </ModalScaffold>
  );
}
