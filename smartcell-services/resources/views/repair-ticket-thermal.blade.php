<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nota de Reparación - {{ $repair->repair_code }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #f1f1f1;
            display: flex;
            justify-content: center;
            padding: 10px;
        }

        /* =========================
   TICKET CENTRADO POS
========================= */
        .container {
            width: 80mm;
            background: #fff;
            padding: 4mm 3mm;
            text-align: center;
        }

        /* =========================
   CABECERA
========================= */
        .company-name {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
        }

        .company-info {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.4;
        }

        /* =========================
   LÍNEAS
========================= */
        .divider {
            border-top: 1px solid #000;
            margin: 6px 0;
        }

        .divider-solid {
            border-top: 2px solid #000;
            margin: 6px 0;
        }

        /* =========================
   TÍTULO
========================= */
        .ticket-title {
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .ticket-code {
            font-size: 13px;
            font-weight: 600;
        }

        .ticket-date {
            font-size: 12px;
        }

        /* =========================
   SECCIONES
========================= */
        .section-label {
            font-size: 14px;
            font-weight: 700;
            margin-top: 8px;
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        /* =========================
   CAMPOS CLIENTE / EQUIPO
========================= */
        .field-row {
            font-size: 13px;
            line-height: 1.6;
        }

        .field-row span {
            font-weight: 700;
        }

        .field-block {
            margin-bottom: 5px;
        }

        .field-block .label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #000;
        }

        .field-block .value {
            font-size: 13px;
            line-height: 1.4;
        }

        /* =========================
   MONTO / TOTALES
========================= */
        .totals {
            margin-top: 6px;
            font-size: 13px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 13px;
        }

        .total-row span:first-child {
            font-weight: 600;
        }

        .total-row.grand {
            font-size: 15px;
            font-weight: 800;
            border-top: 2px solid #000;
            margin-top: 6px;
            padding-top: 6px;
        }

        /* =========================
   QR
========================= */
        .qr-section {
            text-align: center;
            margin-top: 10px;
        }

        .qr-section img {
            width: 90px;
            height: 90px;
        }

        .qr-label {
            font-size: 12px;
            font-weight: 600;
        }

        /* =========================
   FOOTER
========================= */
        .footer {
            font-size: 12px;
            font-weight: 500;
            margin-top: 10px;
            line-height: 1.4;
        }

        /* =========================
   BOTONES
========================= */
        .actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
        }

        .btn {
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            color: #fff;
            background: #2563eb;
        }

        .btn-secondary {
            background: #64748b;
        }

        /* =========================
   IMPRESIÓN POS
========================= */
        @media print {

            @page {
                size: 80mm auto;
                margin: 0;
            }

            html,
            body {
                width: 80mm;
                margin: 0;
                padding: 0;
            }

            body {
                display: flex;
                justify-content: center;
            }

            .container {
                width: 80mm;
                padding: 4mm 3mm;
                text-align: center;
            }

            .actions {
                display: none !important;
            }

            * {
                color: #000 !important;
            }
        }
    </style>
</head>

<body>
    <div class="container">

        <!-- CABECERA EMPRESA -->
        <div class="header">
            <div class="company-name">BEATCELL</div>
            <div class="company-info">
                Av. La Unión N° 1496 Piso 4<br>
                Villa María del Triunfo, Lima<br>
                Tel: +51 950 262 596
            </div>
        </div>

        <hr class="divider-solid">

        <!-- TÍTULO -->
        <div class="ticket-title">Nota de Reparación</div>
        <div class="ticket-code">N° {{ $repair->repair_code }}</div>
        <div class="ticket-date">{{ $repair->created_at->format('d/m/Y H:i') }}</div>

        <hr class="divider">

        <!-- CLIENTE -->
        <div class="section-label">Cliente</div>
        <div class="field-row">
            <span>Nombre:</span>
            {{ optional($repair->client)->first_name ?? '---' }} {{ optional($repair->client)->last_name ?? '' }}
        </div>
        <div class="field-row"><span>DNI:</span> {{ optional($repair->client)->dni ?? 'N/A' }}</div>
        @if(optional($repair->client)->phone)
            <div class="field-row"><span>Tel:</span> {{ $repair->client->phone }}</div>
        @endif

        <hr class="divider">

        <!-- DISPOSITIVO -->
        <div class="section-label">Equipo</div>
        <div class="field-block">
            <div class="label">Descripción</div>
            <div class="value">{{ $repair->device_description ?? 'N/A' }}</div>
        </div>
        @if($repair->device_type)
            <div class="field-block">
                <div class="label">Tipo</div>
                <div class="value">{{ $repair->device_type }}</div>
            </div>
        @endif
        <div class="field-block">
            <div class="label">Falla reportada</div>
            <div class="value">{{ $repair->fault_description ?? 'Sin información' }}</div>
        </div>
        @if($repair->repair_notes)
            <div class="field-block">
                <div class="label">Observaciones</div>
                <div class="value">{{ $repair->repair_notes }}</div>
            </div>
        @endif

        @if($repair->technician)
            <div class="field-block">
                <div class="label">Técnico asignado</div>
                <div class="value">{{ $repair->technician->name ?? 'N/A' }}</div>
            </div>
        @endif

        <hr class="divider">

        <!-- MONTOS -->
        <div class="section-label">Montos</div>
        <div class="totals">
            <div class="total-row">
                <span>Anticipo recibido</span>
                <span>S/ {{ number_format($repair->advance_amount ?? 0, 2) }}</span>
            </div>
            <div class="total-row">
                <span>Saldo pendiente</span>
                <span>S/
                    {{ number_format(max(($repair->total_amount ?? 0) - ($repair->advance_amount ?? 0), 0), 2) }}</span>
            </div>
            <div class="total-row grand">
                <span>TOTAL ESTIMADO</span>
                <span>S/ {{ number_format($repair->total_amount ?? 0, 2) }}</span>
            </div>
        </div>

        <hr class="divider">

        <!-- QR -->
        <div id="qr-section" class="qr-section hidden">
            <img id="qr-image" src="" alt="QR">
            <div class="qr-label">Escanea para ver el estado de tu reparación</div>
        </div>

        <hr class="divider">

        <!-- PIE LEGAL -->
        <div class="footer">
            Guarde este ticket como comprobante.<br>
            El equipo queda bajo custodia del taller.<br>
            No nos hacemos responsables por<br>
            información no respaldada.
        </div>

    </div>

    <div class="actions">
        <button class="btn" onclick="window.print()">🖨 Imprimir</button>
        <button class="btn btn-secondary" onclick="showQR()">🔍 QR</button>
    </div>

    <script>
        window.showQR = function () {
            var url = encodeURIComponent(window.location.href);
            var img = document.getElementById('qr-image');
            var section = document.getElementById('qr-section');
            if (img) {
                img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + url + '&bgcolor=ffffff&color=000000';
            }
            if (section) {
                section.classList.remove('hidden');
            }
        };
    </script>
</body>

</html>