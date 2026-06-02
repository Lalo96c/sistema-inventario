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
            font-family: 'Courier New', Courier, monospace;
            background: #f0f0f0;
            padding: 20px;
            display: flex;
            justify-content: center;
        }

        .container {
            width: 300px;
            background: #fff;
            padding: 12px 10px;
            border: 1px dashed #ccc;
        }

        /* ── CABECERA ── */
        .header {
            text-align: center;
            margin-bottom: 8px;
        }

        .company-name {
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 1px;
        }

        .company-info {
            font-size: 10px;
            line-height: 1.5;
            color: #444;
        }

        .divider {
            border: none;
            border-top: 1px dashed #333;
            margin: 6px 0;
        }

        .divider-solid {
            border: none;
            border-top: 1px solid #333;
            margin: 6px 0;
        }

        /* ── TÍTULO ── */
        .ticket-title {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 0;
        }

        .ticket-code {
            text-align: center;
            font-size: 11px;
            margin-bottom: 2px;
        }

        .ticket-date {
            text-align: center;
            font-size: 10px;
            color: #555;
        }

        /* ── CAMPOS ── */
        .section-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
            margin-top: 6px;
            margin-bottom: 2px;
        }

        .field-row {
            font-size: 10px;
            line-height: 1.6;
        }

        .field-row span {
            font-weight: bold;
        }

        .field-block {
            font-size: 10px;
            margin-bottom: 4px;
        }

        .field-block .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
        }

        .field-block .value {
            font-size: 10px;
            line-height: 1.4;
        }

        /* ── MONTOS ── */
        .totals {
            margin-top: 4px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            line-height: 1.7;
        }

        .total-row.grand {
            font-size: 12px;
            font-weight: bold;
            border-top: 1px solid #333;
            padding-top: 3px;
            margin-top: 2px;
        }

        /* ── QR ── */
        .qr-section {
            text-align: center;
            margin-top: 8px;
            background: #fff;
            padding: 6px;
            border-radius: 8px;
            display: inline-block;
        }

        .qr-section.hidden {
            display: none;
        }

        .qr-section img {
            width: 90px;
            height: 90px;
            background: #fff;
            display: block;
            margin: 0 auto;
        }

        .qr-label {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
        }

        /* ── FIRMA ── */
        .signature {
            margin-top: 10px;
            font-size: 11px;
        }

        .signature-line {
            border-top: 1px dashed #333;
            margin-top: 18px;
            margin-bottom: 3px;
        }

        /* ── PIE ── */
        .footer {
            text-align: center;
            font-size: 11px;
            color: #555;
            margin-top: 8px;
            line-height: 1.5;
        }

        /* ── BOTONES ── */
        .actions {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            justify-content: center;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            color: #fff;
            background: #2563eb;
        }

        .btn-secondary {
            background: #64748b;
        }

        /* ══════════════════════════════════════
           IMPRESIÓN — Xprinter XP-365B / 80mm
           ══════════════════════════════════════ */
        @media print {

            /* Nitidez en Brave/Chrome para térmicas */
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                text-rendering: geometricPrecision;
                -webkit-font-smoothing: none;
                font-smooth: never;
            }

            body {
                -webkit-text-size-adjust: none;
            }

            @page {
                size: 80mm auto;
                margin: 0;
            }

            html,
            body {
                width: 80mm;
                background: white;
                padding: 0;
                margin: 0;
                display: block;
            }

            .container {
                width: 80mm;
                border: none;
                padding: 4mm 3mm;
            }

            .actions {
                display: none !important;
            }

            .company-name {
                font-size: 14px;
            }

            .company-info {
                font-size: 11px;
            }

            .ticket-title {
                font-size: 11px;
            }

            .ticket-code {
                font-size: 10px;
            }

            .ticket-date {
                font-size: 11px;
            }

            .field-row,
            .field-block .value {
                font-size: 10px;
            }

            .section-label,
            .field-block .label {
                font-size: 11px;
            }

            .total-row {
                font-size: 10px;
            }

            .total-row.grand {
                font-size: 11px;
            }

            .footer,
            .signature {
                font-size: 11px;
            }

            .qr-section img {
                width: 80px;
                height: 80px;
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
                Tel: +51 910 488 419
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
        @if($repair->device_lock)
            <div class="field-block">
                <div class="label">Bloqueo/Patrón</div>
                <div class="value">{{ $repair->device_lock }}</div>
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