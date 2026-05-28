<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    /**
     * Obtiene el próximo código de compra disponible con formato PUR-000001
     */
    public function nextCode(): JsonResponse
    {
        $lastPurchase = Purchase::query()
            ->orderByDesc('id')
            ->first();

        if (!$lastPurchase || !$lastPurchase->purchase_code) {
            $nextNumber = 1;
        } else {
            // Extraer el número del código anterior (ej: "PUR-000005" -> 5)
            preg_match('/\d+$/', $lastPurchase->purchase_code, $matches);
            $lastNumber = $matches ? (int) $matches[0] : 0;
            $nextNumber = $lastNumber + 1;
        }

        $nextCode = 'PUR-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

        return response()->json(['next_code' => $nextCode]);
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $filters = [
            'purchase_code' => $request->query('purchase_code'),
            'supplier_name' => $request->query('supplier_name'),
        ];

        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $purchases = Purchase::query()
            ->with(['purchaseDetails.product'])
            ->filter($filters)
            ->filterByDateRange($dateFrom, $dateTo)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return PurchaseResource::collection($purchases);
    }

    public function show($id): PurchaseResource
    {
        $purchase = Purchase::findOrFail($id);

        $purchase->load(['purchaseDetails.product']);

        return new PurchaseResource($purchase);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $data = $request->validated();

        $purchase = DB::transaction(function () use ($data) {
            $productIds = collect($data['details'])
                ->pluck('product_id')
                ->unique()
                ->all();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $purchase = Purchase::query()->create([
                'purchase_code' => $data['purchase_code'],
                'purchase_date' => $data['purchase_date'],
                'supplier_name' => $data['supplier_name'],
                'total_amount' => 0,
            ]);

            $total = 0.0;

            foreach ($data['details'] as $item) {
                $product = $products[$item['product_id']] ?? null;

                if (! $product) {
                    throw ValidationException::withMessages([
                        'details' => ["Producto no encontrado: {$item['product_id']}"],
                    ]);
                }

                $quantity = (int) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];

                // Increment product quantity for purchases (entrada de stock)
                $product->increment('quantity', $quantity);

                // Create inventory movement for purchase
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'type' => InventoryMovement::TYPE_ENTRADA,
                    'quantity' => $quantity,
                    'reason' => InventoryMovement::REASON_COMPRA,
                ]);

                $lineTotal = round($quantity * $unitPrice, 2);

                PurchaseDetail::query()->create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ]);

                $total += $lineTotal;
            }

            $purchase->update(['total_amount' => round($total, 2)]);

            return $purchase->fresh(['purchaseDetails.product']);
        });

        return (new PurchaseResource($purchase))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePurchaseRequest $request, $id): PurchaseResource
    {
        $purchase = Purchase::findOrFail($id);

        $data = $request->validated();

        $purchase = DB::transaction(function () use ($purchase, $data) {
            $header = collect($data)->only(['purchase_code', 'purchase_date', 'supplier_name'])->all();

            if ($header !== []) {
                $purchase->update($header);
            }

            if (isset($data['details'])) {
                $existingProductIds = $purchase->purchaseDetails->pluck('product_id');
                $newProductIds = collect($data['details'])->pluck('product_id');

                $productIds = $existingProductIds
                    ->merge($newProductIds)
                    ->unique()
                    ->all();

                $products = Product::query()
                    ->whereIn('id', $productIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                // Revert the stock changes from the old details
                foreach ($purchase->purchaseDetails as $detail) {
                    $product = $products[$detail->product_id] ?? null;

                    if ($product) {
                        $product->decrement('quantity', $detail->quantity);
                    }
                }

                $purchase->purchaseDetails()->delete();

                $total = 0.0;

                foreach ($data['details'] as $item) {
                    $product = $products[$item['product_id']] ?? null;

                    if (! $product) {
                        throw ValidationException::withMessages([
                            'details' => ["Producto no encontrado: {$item['product_id']}"],
                        ]);
                    }

                    $quantity = (int) $item['quantity'];
                    $unitPrice = (float) $item['unit_price'];

                    // Increment product quantity for purchases (entrada de stock)
                    $product->increment('quantity', $quantity);

                    $lineTotal = round($quantity * $unitPrice, 2);

                    PurchaseDetail::query()->create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                    ]);

                    $total += $lineTotal;
                }

                $purchase->update(['total_amount' => round($total, 2)]);
            }

            return $purchase->fresh(['purchaseDetails.product']);
        });

        return new PurchaseResource($purchase);
    }

    public function destroy($id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        DB::transaction(function () use ($purchase) {
            $productIds = $purchase->purchaseDetails->pluck('product_id')->unique()->all();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // Revert the stock changes when deleting a purchase
            foreach ($purchase->purchaseDetails as $detail) {
                $product = $products[$detail->product_id] ?? null;

                if ($product) {
                    $product->decrement('quantity', $detail->quantity);
                }
            }

            $purchase->delete();
        });

        return response()->json(null, 204);
    }
}
