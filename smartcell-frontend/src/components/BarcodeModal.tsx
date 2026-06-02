import { useEffect, useRef, useState } from 'react';
import { ModalScaffold } from './ModalScaffold';
import type { ApiProduct } from '../types/product';

// JsBarcode se carga desde CDN en el HTML, o via import dinámico
// Usamos el script tag approach para no agregar dependencia al package.json

type Props = {
  open: boolean;
  product: ApiProduct | null;
  onClose: () => void;
};

function loadJsBarcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).JsBarcode) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar JsBarcode'));
    document.head.appendChild(script);
  });
}

function BarcodeModalBody({ product, onClose }: { product: ApiProduct; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copies, setCopies] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJsBarcode()
      .then(() => setReady(true))
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (!ready || !svgRef.current) return;
    try {
      (window as any).JsBarcode(svgRef.current, product.code, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 13,
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000',
        font: 'Courier New',
      });
    } catch (e) {
      setError('Código inválido para generar código de barras');
    }
  }, [ready, product.code]);

  function handlePrint() {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));

    // Construir etiquetas repetidas según cantidad de copias
    const labels = Array.from({ length: copies }, (_, i) => `
      <div class="label">
        <div class="product-name">${product.name}</div>
        <img src="data:image/svg+xml;base64,${svgBase64}" alt="barcode" />
        <div class="price">S/ ${Number(product.sale_price).toFixed(2)}</div>
      </div>
    `).join('');

    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) { alert('Permite ventanas emergentes para imprimir'); return; }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiquetas - ${product.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 80mm auto; margin: 0; }
    body { font-family: 'Courier New', monospace; background: white; }
    .label {
      width: 80mm;
      padding: 4mm 3mm;
      border-bottom: 1px dashed #ccc;
      text-align: center;
      page-break-inside: avoid;
    }
    .product-name {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .label img { width: 100%; max-width: 70mm; height: auto; }
    .price {
      font-size: 13px;
      font-weight: bold;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  ${labels}
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <ModalScaffold onBackdropClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Código de barras</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <p className="text-xs text-slate-500 mb-1 truncate font-medium">{product.name}</p>
        <p className="text-xs text-slate-400 mb-4 font-mono">{product.code}</p>

        {error ? (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 mb-4">
            {error}
          </div>
        ) : (
          <div className="flex justify-center items-center bg-white border border-slate-200 rounded-xl p-3 mb-4 min-h-[100px]">
            {!ready ? (
              <p className="text-xs text-slate-400">Cargando…</p>
            ) : (
              <svg ref={svgRef} />
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Copias:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-center tabular-nums focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
          />
          <span className="text-xs text-slate-400">etiqueta{copies !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            disabled={!ready || !!error}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🖨 Imprimir
          </button>
        </div>
      </div>
    </ModalScaffold>
  );
}

export function BarcodeModal({ open, product, onClose }: Props) {
  if (!open || !product) return null;
  return <BarcodeModalBody product={product} onClose={onClose} />;
}
