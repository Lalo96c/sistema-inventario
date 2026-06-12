<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InventoryMovementController;
use App\Http\Controllers\Api\DeviceRepairController;
use App\Http\Controllers\Api\TechnicianController;
use App\Http\Controllers\Api\ImageRepairController;
use App\Http\Controllers\Api\ConfigController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Ruta pública para obtener configuración
Route::get('/config', [ConfigController::class, 'getPublicConfig'])->name('api.config.public');

Route::post('/auth/refresh', [AuthController::class, 'refresh'])->middleware('jwt.refresh');

Route::middleware('auth:api')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/technicians', [TechnicianController::class, 'index']);
    Route::post('/technicians', [TechnicianController::class, 'store']);

    Route::get('/clients/query-by-dni', [ClientController::class, 'queryByDni']);
    Route::get('/clients', [ClientController::class, 'index']);
    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::put('/clients/{client}', [ClientController::class, 'update']);
    Route::delete('/clients/{client}', [ClientController::class, 'destroy']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/next-code', [ProductController::class, 'nextCode']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/next-code', [SaleController::class, 'nextCode']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{sale}', [SaleController::class, 'show']);
    Route::put('/sales/{sale}', [SaleController::class, 'update']);
    Route::delete('/sales/{sale}', [SaleController::class, 'destroy']);

    Route::get('/purchases', [PurchaseController::class, 'index']);
    Route::get('/purchases/next-code', [PurchaseController::class, 'nextCode']);
    Route::post('/purchases', [PurchaseController::class, 'store']);
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show']);
    Route::put('/purchases/{purchase}', [PurchaseController::class, 'update']);
    Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy']);

    Route::get('/inventory-movements', [InventoryMovementController::class, 'index']);
    Route::get('/inventory-movements/{inventory_movement}', [InventoryMovementController::class, 'show']);
    Route::post('/inventory-movements', [InventoryMovementController::class, 'store']);
    Route::put('/inventory-movements/{inventory_movement}', [InventoryMovementController::class, 'update']);
    Route::delete('/inventory-movements/{inventory_movement}', [InventoryMovementController::class, 'destroy']);

    Route::get('/device-repairs', [DeviceRepairController::class, 'index']);
    Route::post('/device-repairs', [DeviceRepairController::class, 'store']);
    Route::get('/device-repairs/{id}', [DeviceRepairController::class, 'show']);
    Route::put('/device-repairs/{id}', [DeviceRepairController::class, 'update']);
    Route::delete('/device-repairs/{id}', [DeviceRepairController::class, 'destroy']);
    Route::apiResource('technicians', 'App\Http\Controllers\Api\TechnicianController');
});

// Rutas públicas para gestión de imágenes de reparación (sin autenticación, con CORS)
Route::get('/images-repair/{repairId}', [ImageRepairController::class, 'show'])->name('api.images-repair.show');
Route::post('/images-repair/{repairId}', [ImageRepairController::class, 'store'])->name('api.images-repair.store');
Route::delete('/images-repair/{repairId}/{fileName}', [ImageRepairController::class, 'destroy'])
    ->where('fileName', '.*')
    ->name('api.images-repair.destroy');
Route::delete('/images-repair/{repairId}', [ImageRepairController::class, 'destroyRepairFolder'])->name('api.images-repair.destroy-folder');

