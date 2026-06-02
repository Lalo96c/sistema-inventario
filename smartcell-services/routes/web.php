<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RepairReceiptController;
use App\Http\Controllers\SaleReceiptController;

Route::get('/', function () {
    return response()->json([
        'message' => 'API Laravel',
        'docs' => 'Define tus rutas en routes/api.php (prefijo /api).',
    ]);
});

// Ruta para la vista Blade de upload de imágenes desde móvil (QR)
Route::get('/images-repair-form/{repairId}', function ($repairId) {
    return view('repair-images-form', ['repairId' => $repairId]);
})->name('images-repair.form');

// Rutas para gestión de imágenes de reparación desde la vista Blade
Route::post('/images-repair/{repairId}', function ($repairId) {
    $controller = app(\App\Http\Controllers\Api\ImageRepairController::class);
    return $controller->store(request(), $repairId);
})->name('images-repair.store');

Route::get('/images-repair/{repairId}', function ($repairId) {
    $controller = app(\App\Http\Controllers\Api\ImageRepairController::class);
    return $controller->show($repairId);
})->name('images-repair.show');

Route::delete('/images-repair/{repairId}/{fileName}', function ($repairId, $fileName) {
    $controller = app(\App\Http\Controllers\Api\ImageRepairController::class);
    return $controller->destroy($repairId, $fileName);
})->name('images-repair.destroy');

// Ruta para el comprobante de reparación (accesible públicamente)
Route::get('/repair-receipt/{id}', [RepairReceiptController::class, 'show'])
    ->name('repair-receipt.show');


// Mostrar ticket térmico (80mm)
Route::get('/repair-ticket/{id}', [RepairReceiptController::class, 'ticket'])
    ->name('repair-ticket.thermal');
// Nota: no se genera PDF desde la plantilla térmica; `repair-ticket-thermal.blade.php`
// se mantiene solo para visualización/imprimir en impresoras térmicas 80mm.

// Ruta para la boleta de venta (accesible públicamente)
Route::get('/sale-receipt/{id}', [SaleReceiptController::class, 'show'])
    ->name('sale-receipt.show');

// Ruta para el ticket térmico de venta 80mm
Route::get('/sales/{id}/ticket', [SaleReceiptController::class, 'ticket'])
    ->name('sales.ticket');

// Ruta para la vista PDF/A4 de la boleta de venta
Route::get('/sales/{id}/pdf', [SaleReceiptController::class, 'pdf'])
    ->name('sales.pdf');
