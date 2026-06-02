<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boleta de Venta - {{ $sale->sale_code }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

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
        .header { text-align: center; margin-bottom: 8px; }
        .company-name { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
        .company-info { font-size: 10px; line-height: 1.5; color: #444; }
        .divider { border: none; border-top: 1px dashed #333; margin: 6px 0; }
        .divider-solid { border: none; border-top: 1px solid #333; margin: 6px 0; }

        /* ── TÍTULO BOLETA ── */
        .ticket-title { text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0; }
        .ticket-code  { text-align: center; font-size: 11px; margin-bottom: 2px; }
        .ticket-date  { text-align: center; font-size: 10px; color: #555; }

        /* ── SECCIÓN CLIENTE ── */
        .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-top: 6px; margin-bottom: 2px; }
        .field-row { font-size: 10px; line-height: 1.5; }
        .field-row span { font-weight: bold; }

        /* ── TABLA DE PRODUCTOS ── */
        .products-table { width: 100%; font-size: 10px; border-collapse: collapse; margin-top: 4px; }
        .products-table th { font-size: 11px; text-transform: uppercase; text-align: left; border-bottom: 1px solid #333; padding: 2px 0; font-weight: bold; }
        .products-table th.right, .products-table td.right { text-align: right; }
        .products-table td { padding: 2px 0; border-bottom: 1px dotted #ccc; vertical-align: top; }
        .products-table tbody tr:last-child td { border-bottom: none; }

        /* ── TOTALES ── */
        .totals { margin-top: 6px; }
        .total-row { display: flex; justify-content: space-between; font-size: 10px; line-height: 1.6; }
        .total-row.grand { font-size: 12px; font-weight: bold; border-top: 1px solid #333; padding-top: 3px; margin-top: 2px; }

        /* ── PIE ── */
        .footer { text-align: center; font-size: 11px; color: #555; margin-top: 8px; line-height: 1.5; }

        /* ── BOTONES (solo pantalla) ── */
        .actions { display: flex; gap: 8px; margin-top: 16px; justify-content: center; }
        .btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; color: #fff; background: #2563eb; }
        .btn-secondary { background: #64748b; }

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
        body { -webkit-text-size-adjust: none; }
            @page {
                size: 80mm auto;   /* ancho fijo, altura automática = rollo térmico */
                margin: 0;
            }

            html, body {
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

            .actions { display: none !important; }

            /* Ajuste tipográfico para papel térmico */
            .company-name { font-size: 14px; }
            .company-info { font-size: 11px; }
            .ticket-title { font-size: 11px; }
            .ticket-code  { font-size: 10px; }
            .ticket-date  { font-size: 11px; }
            .field-row    { font-size: 10px; }
            .section-label{ font-size: 11px; }
            .products-table, .products-table th, .products-table td { font-size: 11px; }
            .total-row    { font-size: 10px; }
            .total-row.grand { font-size: 11px; }
            .footer       { font-size: 11px; }
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
    <div class="ticket-title">Boleta de Venta</div>
    <div class="ticket-code">N° {{ $sale->sale_code }}</div>
    <div class="ticket-date">{{ $sale->created_at->format('d/m/Y H:i') }}</div>

    <hr class="divider">

    <!-- CLIENTE -->
    <div class="section-label">Cliente</div>
    <div class="field-row">
        <span>Nombre:</span>
        {{ optional($sale->client)->first_name ?? '---' }} {{ optional($sale->client)->last_name ?? '' }}
    </div>
    <div class="field-row">
        <span>DNI:</span> {{ optional($sale->client)->dni ?? 'N/A' }}
    </div>
    @if(optional($sale->client)->phone)
    <div class="field-row">
        <span>Tel:</span> {{ $sale->client->phone }}
    </div>
    @endif

    <hr class="divider">

    <!-- PRODUCTOS -->
    <div class="section-label">Detalle</div>
    <table class="products-table">
        <thead>
            <tr>
                <th style="width:40%">Producto</th>
                <th class="right" style="width:15%">Cant</th>
                <th class="right" style="width:20%">P.Unit</th>
                <th class="right" style="width:25%">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @forelse($sale->saleDetails ?? [] as $line)
            <tr>
                <td>{{ $line->product?->name ?? '—' }}</td>
                <td class="right">{{ number_format($line->quantity, 0) }}</td>
                <td class="right">S/{{ number_format($line->unit_price ?? 0, 2) }}</td>
                <td class="right">S/{{ number_format($line->line_total ?? 0, 2) }}</td>
            </tr>
            @empty
            <tr><td colspan="4" style="text-align:center;color:#999">Sin productos</td></tr>
            @endforelse
        </tbody>
    </table>

    <hr class="divider">

    <!-- TOTALES -->
    <div class="totals">
        <div class="total-row">
            <span>Subtotal (sin IGV)</span>
            <span>S/ {{ number_format(($sale->total_amount ?? 0) / 1.18, 2) }}</span>
        </div>
        <div class="total-row">
            <span>IGV (18%)</span>
            <span>S/ {{ number_format(($sale->total_amount ?? 0) - ($sale->total_amount ?? 0) / 1.18, 2) }}</span>
        </div>
        <div class="total-row grand">
            <span>TOTAL</span>
            <span>S/ {{ number_format($sale->total_amount ?? 0, 2) }}</span>
        </div>
    </div>

    <hr class="divider">

    <!-- PIE -->
    <div class="footer">
        Gracias por su compra.<br>
        Cambios válidos 7 días con boleta original.<br>
        ¡Vuelva pronto!
    </div>

</div>

<div class="actions">
    <button class="btn" onclick="window.print()">🖨 Imprimir</button>
    <button class="btn btn-secondary" onclick="window.history.back()">← Volver</button>
</div>

<script>
    window.addEventListener('DOMContentLoaded', function () {
        try {
            window.print();
        } catch (error) {
            console.warn('No se pudo iniciar la impresión automáticamente:', error);
        }
    });
</script>

</body>
</html>
