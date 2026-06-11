<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boleta - {{ $sale->sale_code }}</title>

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

        .ticket {
            width: 80mm;
            background: #fff;
            padding: 4mm 3mm;
            text-align: center;
        }

        /* =========================
       🔥 TIPOGRAFÍA AGRANDADA POS
    ========================= */

        .company {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
        }

        .info {
            font-size: 13px;
            line-height: 1.4;
        }

        .title {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .code {
            font-size: 13px;
        }

        .date {
            font-size: 12px;
        }

        .section {
            font-size: 14px;
            font-weight: bold;
            margin-top: 6px;
        }

        .text {
            font-size: 13px;
            line-height: 1.5;
        }

        /* =========================
       LÍNEAS
    ========================= */

        .line {
            border-top: 1px dashed #000;
            margin: 6px 0;
        }

        .solid {
            border-top: 1px solid #000;
            margin: 6px 0;
        }

        /* =========================
       TABLA POS
    ========================= */

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        th {
            border-bottom: 1px solid #000;
            padding: 4px 0;
            text-transform: uppercase;
            font-size: 12px;
        }

        td {
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 12px;
        }

        .left {
            text-align: left;
        }

        .right {
            text-align: right;
        }

        /* =========================
       TOTALES
    ========================= */

        .totals {
            margin-top: 6px;
            font-size: 12px;
        }

        .row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 13px;
        }

        .total-final {
            font-size: 15px;
            font-weight: bold;
            border-top: 1px solid #000;
            margin-top: 6px;
            padding-top: 6px;
        }

        /* =========================
       FOOTER
    ========================= */

        .footer {
            font-size: 12px;
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
            border: none;
            cursor: pointer;
            color: #fff;
            background: #2563eb;
        }

        .btn-secondary {
            background: #64748b;
        }

        /* =========================
       IMPRESIÓN
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

            .ticket {
                width: 80mm;
                padding: 4mm 3mm;
                text-align: center;
            }

            .actions {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <div class="ticket">

        <!-- EMPRESA -->
        <div class="company">BEATCELL</div>
        <div class="info">
            Av. La Unión N° 1496 Piso 4<br>
            Villa María del Triunfo<br>
            Tel: 950 262 596
        </div>

        <div class="solid"></div>

        <!-- TITULO -->
        <div class="title">Boleta de Venta</div>
        <div class="code">N° {{ $sale->sale_code }}</div>
        <div class="date">{{ $sale->created_at->format('d/m/Y H:i') }}</div>

        <div class="line"></div>

        <!-- CLIENTE -->
        <div class="section">CLIENTE</div>
        <div class="text">
            {{ optional($sale->client)->first_name ?? '---' }}
            {{ optional($sale->client)->last_name ?? '' }}
        </div>
        <div class="text">DNI: {{ optional($sale->client)->dni ?? 'N/A' }}</div>

        <div class="line"></div>

        <!-- PRODUCTOS -->
        <div class="section">DETALLE</div>

        <table>
            <thead>
                <tr>
                    <th class="left">Prod</th>
                    <th class="right">Cant</th>
                    <th class="right">P.Unit</th>
                    <th class="right">Total</th>
                </tr>
            </thead>

            <tbody>
                @forelse($sale->saleDetails ?? [] as $line)
                    <tr>
                        <td class="left">{{ $line->product?->name ?? '—' }}</td>
                        <td class="right">{{ $line->quantity }}</td>
                        <td class="right">{{ number_format($line->unit_price, 2) }}</td>
                        <td class="right">{{ number_format($line->line_total, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align:center;">Sin productos</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="line"></div>

        <!-- TOTALES -->
        <div class="totals">
            <div class="row">
                <span>Subtotal</span>
                <span>S/ {{ number_format(($sale->total_amount ?? 0) / 1.18, 2) }}</span>
            </div>

            <div class="row">
                <span>IGV</span>
                <span>S/ {{ number_format(($sale->total_amount ?? 0) - ($sale->total_amount ?? 0) / 1.18, 2) }}</span>
            </div>

            <div class="row total-final">
                <span>TOTAL</span>
                <span>S/ {{ number_format($sale->total_amount ?? 0, 2) }}</span>
            </div>
        </div>

        <div class="line"></div>

        <!-- FOOTER -->
        <div class="footer">
            Gracias por su compra<br>
            Vuelva pronto
        </div>

    </div>

    <!-- BOTONES -->
    <div class="actions">
        <button class="btn" onclick="window.print()">Imprimir</button>
        <button class="btn btn-secondary" onclick="window.history.back()">Volver</button>
    </div>

    <script>
        window.onload = () => window.print();
    </script>

</body>

</html>