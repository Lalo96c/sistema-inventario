<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boleta de Venta - {{ $sale->sale_code }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 30px 20px;
        }

        .container {
            width: min(100%, 900px);
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .ticket-header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 15px;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 15px;
            background: linear-gradient(90deg, #f8fafc 0%, transparent 100%);
            padding: 15px;
            border-radius: 6px;
        }

        .ticket-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #2563eb;
            line-height: 1.2;
        }

        .ticket-meta {
            text-align: left;
            font-size: 13px;
            color: #475569;
            margin-top: 8px;
        }

        .ticket-meta strong {
            color: #1e40af;
            font-weight: 700;
        }

        .section {
            margin-bottom: 25px;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 0;
        }

        .detail-card,
        .total-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 18px;
            font-size: 13px;
            line-height: 1.6;
        }

        .detail-card:hover {
            border-color: #2563eb;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }

        .detail-card strong,
        .total-card strong {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #2563eb;
            margin-bottom: 8px;
            font-weight: 700;
        }

        .detail-card p,
        .total-card p {
            margin: 0 0 12px 0;
            color: #1e293b;
            font-weight: 600;
            font-size: 14px;
        }

        .small-note {
            font-size: 12px;
            color: #475569;
            line-height: 1.7;
            border-left: 4px solid #f59e0b;
            padding: 16px 20px;
            background: #fffbeb;
            border-radius: 8px;
            margin-top: 25px;
            display: none;
        }

        .signature {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 2px solid #e2e8f0;
            font-size: 13px;
            color: #475569;
            display: none;
        }

        .signature-line {
            margin-top: 18px;
            border-top: 1px dashed #333;
            width: 100%;
        }

        .ticket-qr {
            width: 120px;
            height: 120px;
            border: 2px solid #e2e8f0;
            padding: 8px;
            background: #fff;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            margin-top: 30px;
        }

        .btn {
            flex: 1 1 auto;
            min-width: 120px;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            color: #fff;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            text-align: center;
            transition: all 0.3s;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
        }

        .btn-secondary {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }

        .btn-secondary:hover {
            box-shadow: 0 6px 20px rgba(100, 116, 139, 0.3);
        }

        .totals-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
        }

        .total-card {
            text-align: center;
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-color: #93c5fd;
        }

        .total-card strong {
            color: #0c4a6e;
        }

        .total-card p {
            color: #075985;
            font-size: 16px;
        }

        .products-section {
            margin-bottom: 25px;
            margin-top: 25px;
        }

        .products-section strong {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #2563eb;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .products-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        .products-table thead {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 2px solid #e2e8f0;
        }

        .products-table th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #2563eb;
        }

        .products-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
            color: #1e293b;
        }

        .products-table tbody tr:last-child td {
            border-bottom: none;
        }

        .products-table tbody tr:hover {
            background: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .company-footer {
            text-align: center;
            font-size: 12px;
        }

        .company-footer img {
            max-width: 40px;
            height: auto;
        }

        .company-name {
            font-size: 14px;
            font-weight: 700;
            color: #374151;
            letter-spacing: 0.02em;
        }

        .company-info {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
        }

        .company-info p {
            margin: 3px 0;
        }

        .company-contact-item {
            display: inline-block;
            margin: 2px 8px;
        }

        .ticket-title-section {
            text-align: left;
        }

        .qr-section {
            display: flex;
            justify-content: flex-end;
            align-items: flex-start;
        }

        @media print {
            @page {
                size: 210mm 99mm;
                margin: 0;
            }

            html,
            body {
                width: 210mm;
                height: 99mm;
                background: white;
                padding: 0;
                margin: 0;
                overflow: hidden;
            }

            .container {
                box-shadow: none;
                border: none;
                padding: 6px;
                width: 100%;
                max-width: 100%;
            }

            .actions {
                display: none;
            }

            .ticket-header {
                border-bottom: 1px solid #333;
                margin-bottom: 6px;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                align-items: flex-start;
                padding: 4px;
            }

            .ticket-header div {
                flex: 1;
            }

            .ticket-title {
                font-size: 14px;
                margin-bottom: 2px;
            }

            .ticket-meta {
                text-align: left;
                font-size: 8px;
                line-height: 1.2;
                margin-top: 4px;
            }

            .ticket-meta strong {
                font-size: 8px;
            }

            .section {
                margin-bottom: 6px;
            }

            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .detail-card,
            .total-card {
                padding: 4px;
                font-size: 8px;
                background: transparent;
                border: none;
            }

            .detail-card strong,
            .total-card strong {
                font-size: 7px;
                margin-bottom: 2px;
                display: block;
            }

            .detail-card p,
            .total-card p {
                font-size: 8px;
                margin: 0;
            }

            .small-note {
                font-size: 7px;
                margin-bottom: 4px;
                padding-top: 4px;
                border-top: 1px dashed #ccc;
                line-height: 1.3;
            }

            .signature {
                margin-top: 6px;
                padding-top: 4px;
                border-top: 1px solid #ccc;
                font-size: 8px;
            }

            .signature-line {
                margin-top: 6px;
                border-top: 1px dashed #333;
                height: 0;
            }

            .ticket-qr {
                width: 50px;
                height: 50px;
                border: 1px solid #333;
            }

            .totals-row {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 6px;
            }

            .totals-row .total-card {
                text-align: center;
            }

            .print-hide {
                display: none !important;
            }

            .small-note {
                display: block !important;
            }

            .company-footer {
                font-size: 8px;
            }

            .company-footer img {
                max-width: 20px;
            }

            .company-name {
                font-size: 9px;
            }

            .company-info {
                font-size: 7px;
                line-height: 1.2;
            }

            .company-info p {
                margin: 1px 0;
            }

            .company-contact-item {
                font-size: 6px;
                margin: 1px 4px;
            }

            .products-table thead {
                background: transparent;
                border-bottom: 1px solid #333;
            }

            .products-table th {
                padding: 2px;
                font-size: 7px;
            }

            .products-table td {
                padding: 2px;
                font-size: 7px;
                border-bottom: 1px solid #ccc;
            }
        }

        @media (max-width: 420px) {
            .ticket-header {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }

            .details-grid {
                grid-template-columns: 1fr;
            }

            .products-table th,
            .products-table td {
                padding: 8px;
                font-size: 11px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="ticket-header">
            <div class="company-footer">
                <img src="{{ env('FRONTEND_URL') }}/logo.png" alt="Beatcell Logo" onerror="this.style.display='none'">
                <div class="company-name">Beatcell</div>
                <div class="company-info">
                    <p>AV. LA UNION N° 1496 Piso 4 - Villa Maria Del Triunfo, Lima, Perú</p>
                    <div class="company-contact-item">
                        <span>Tel: +51 950262596</span>
                    </div>
                </div>
            </div>
            <div class="ticket-title-section">
                <div class="ticket-title">Boleta de Venta</div>
                <div class="ticket-meta">
                    <strong>Folio: {{ $sale->sale_code }}</strong>
                    <p>Fecha: {{ $sale->created_at->format('d/m/Y H:i') }}</p>
                </div>
            </div>
        </div>

        @php
            $productNames = $sale->saleDetails
                ? $sale->saleDetails->pluck('product.name')->filter()->unique()->implode(', ')
                : null;
        @endphp

        <div class="section">
            <div class="details-grid">
                <div class="detail-card">
                    <strong>Cliente</strong>
                    <p>{{ optional($sale->client)->first_name ?? '---' }}
                        {{ optional($sale->client)->last_name ?? '' }}
                    </p>
                    <strong>DNI</strong>
                    <p>{{ optional($sale->client)->dni ?? 'N/A' }}</p>
                </div>
                <div class="detail-card">
                    <strong>Contacto</strong>
                    <p>{{ optional($sale->client)->phone ?? 'N/A' }}</p>
                    <strong>Fecha de Venta</strong>
                    <p>{{ $sale->created_at->format('d/m/Y H:i') }}</p>
                </div>
            </div>
        </div>

        @if(!empty($productNames))
            <div class="section">
                <div class="detail-card">
                    <strong>Producto(s) vendidos</strong>
                    <p>{{ $productNames }}</p>
                </div>
            </div>
        @endif

        <div class="products-section">
            <strong>Productos</strong>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th class="text-right">Cant.</th>
                        <th class="text-right">P. Unit.</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($sale->saleDetails ?? [] as $line)
                        <tr>
                            <td>{{ $line->product?->code ?? '#' . $line->product_id }}</td>
                            <td>{{ $line->product?->name ?? '—' }}</td>
                            <td class="text-right">{{ number_format($line->quantity, 0) }}</td>
                            <td class="text-right">S/ {{ number_format($line->unit_price ?? 0, 2, '.', ',') }}</td>
                            <td class="text-right">S/ {{ number_format($line->line_total ?? 0, 2, '.', ',') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" style="text-align: center; color: #999;">Sin productos registrados</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="totals-row">
                <div class="total-card">
                    <strong>Subtotal</strong>
                    <p>S/ {{ number_format(($sale->total_amount ?? 0) * 0.81, 2, '.', ',') }}</p>
                </div>
                <div class="total-card">
                    <strong>IGV (19%)</strong>
                    <p>S/ {{ number_format(($sale->total_amount ?? 0) * 0.19, 2, '.', ',') }}</p>
                </div>
                <div class="total-card">
                    <strong>Total</strong>
                    <p>S/ {{ number_format($sale->total_amount ?? 0, 2, '.', ',') }}</p>
                </div>
            </div>
        </div>

        <div class="section small-note">
            <p>Gracias por su compra. Guarde este comprobante. Beatcell se reserva el derecho de cambio dentro de 7 días
                con boleta original.</p>
        </div>

        <div class="actions">
            <button class="btn" onclick="window.print()">Imprimir</button>
        </div>
    </div>

    <script>
        // Sin QR para boleta de ventas
    </script>
</body>

</html>