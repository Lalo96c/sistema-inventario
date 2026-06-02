<?php

namespace App\Http\Controllers;

use App\Models\DeviceRepair;
use Illuminate\Http\Request;

class RepairReceiptController extends Controller
{
    /**
     * Mostrar comprobante de reparación (HTML)
     * 
     * @param int $id ID de la reparación
     * @return \Illuminate\View\View
     */
    public function show($id)
    {
        $repair = DeviceRepair::with(['client', 'technician'])->findOrFail($id);
        
        return view('repair-receipt', [
            'repair' => $repair,
        ]);
    }

    /**
     * Mostrar ticket térmico (HTML 80mm)
     * Genera HTML desde repair-ticket-thermal.blade.php
     * 
     * @param int $id ID de la reparación
     * @return \Illuminate\View\View
     */
    public function ticket($id)
    {
        $repair = DeviceRepair::with(['client', 'technician'])->findOrFail($id);
        
        return view('repair-ticket-thermal', [
            'repair' => $repair,
        ]);
    }

    /**
     * Descargar ticket térmico como PDF
     * Genera PDF desde repair-ticket-thermal.blade.php
     * 
     * @param int $id ID de la reparación
     * @return \Illuminate\Http\Response
     */
    // No generar PDF para el ticket térmico: la plantilla `repair-ticket-thermal.blade.php`
    // se usa únicamente para visualización e impresión física en impresoras 80mm.
}
