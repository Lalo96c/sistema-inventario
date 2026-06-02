<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceRepair;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class ImageRepairController extends Controller
{
    /**
     * Guardar imagen de reparación en una carpeta identificada por ID
     *
     * @param Request $request
     * @param string $repairId
     * @return JsonResponse
     */
    public function store(Request $request, string $repairId): JsonResponse
    {
        try {
            \Log::info('ImageRepairController store iniciado', [
                'repairId' => $repairId,
                'hasFile' => $request->hasFile('image'),
                'files' => array_keys($request->allFiles()),
                'method' => $request->getMethod(),
                'contentType' => $request->header('content-type'),
            ]);

            // Validación sin lanzar excepciones
            $validator = Validator::make($request->all(), [
                'image' => 'required|file|max:51200',
            ]);

            if ($validator->fails()) {
                \Log::error('Validación falló', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            if (!$request->hasFile('image') || !$request->file('image')->isValid()) {
                \Log::error('Archivo no válido', [
                    'hasFile' => $request->hasFile('image'),
                    'isValid' => $request->hasFile('image') ? $request->file('image')->isValid() : false,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo no es válido o no se subió correctamente',
                ], 422)->header('Content-Type', 'application/json');
            }

            $image = $request->file('image');
            \Log::info('Archivo recibido', [
                'originalName' => $image->getClientOriginalName(),
                'mimeType' => $image->getMimeType(),
                'size' => $image->getSize(),
                'extension' => $image->getClientOriginalExtension(),
            ]);
            
            // Validar extensión manualmente - más flexible para fotos de cámara
            $allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic', 'heif', 'raw', 'bmp', 'tiff'];
            $extension = strtolower($image->getClientOriginalExtension());
            
            // Si no tiene extensión clara, validar por MIME type
            if (!$extension) {
                $mimeType = $image->getMimeType();
                if (!$mimeType || strpos($mimeType, 'image/') !== 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El archivo no es una imagen válida',
                    ], 422)->header('Content-Type', 'application/json');
                }
                // Asignar extensión basada en MIME type
                $mimeToExtension = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/gif' => 'gif',
                    'image/webp' => 'webp',
                    'image/heic' => 'heic',
                    'image/heif' => 'heif',
                ];
                $extension = $mimeToExtension[$mimeType] ?? 'jpg';
                \Log::info("Extensión asignada por MIME type: $extension");
            } elseif (!in_array($extension, $allowedExtensions)) {
                // Validar MIME type como alternativa si la extensión no está permitida
                $mimeType = $image->getMimeType();
                if (!$mimeType || strpos($mimeType, 'image/') !== 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Extensión no permitida: .{$extension}",
                    ], 422)->header('Content-Type', 'application/json');
                }
                // Confiar en MIME type si la extensión es rara
                \Log::info("Archivo con extensión no estándar pero MIME type válido: $extension -> $mimeType");
            }

            // Procesar la imagen
            $fileName = time() . '_' . uniqid() . '.' . $extension;
            $repairPath = "repairs/{$repairId}";
            
            \Log::info("Intentando guardar imagen", [
                'fileName' => $fileName,
                'repairPath' => $repairPath,
            ]);
            
            // Guardar en storage/app/public mediante Storage facade
            $disk = Storage::disk('public');
            if (!$disk->exists($repairPath)) {
                $disk->makeDirectory($repairPath, 0755, true);
                \Log::info("Directorio creado: {$repairPath}");
            }
            
            // Guardar el archivo
            $disk->putFileAs($repairPath, $image, $fileName);
            $filePath = $disk->path($repairPath . '/' . $fileName);

            if (!file_exists($filePath)) {
                \Log::error("Archivo no guardado correctamente: {$filePath}");
                return response()->json([
                    'success' => false,
                    'message' => 'Error al guardar la imagen en el servidor',
                ], 500)->header('Content-Type', 'application/json');
            }

            \Log::info('Imagen guardada exitosamente', [
                'fileName' => $fileName,
                'repairPath' => $repairPath,
                'filePath' => $filePath,
                'fileSize' => filesize($filePath),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Imagen guardada exitosamente',
                'repair_id' => $repairId,
                'file_name' => $fileName,
                'path' => "{$repairPath}/{$fileName}",
                'url' => Storage::disk('public')->url("{$repairPath}/{$fileName}"),
                'size' => filesize($filePath),
                'original_name' => $image->getClientOriginalName(),
            ], 201)->header('Content-Type', 'application/json');

        } catch (\Exception $e) {
            \Log::error('Error en ImageRepairController store:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la imagen: ' . $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
            ], 500)->header('Content-Type', 'application/json');
        }
    }

    /**
     * Obtener las imágenes de una reparación
     *
     * @param string $repairId
     * @return JsonResponse
     */
    public function show(string $repairId): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $repairPath = "repairs/{$repairId}";

            // Si el directorio no existe, retornar array vacío en lugar de 404
            if (!$disk->exists($repairPath)) {
                return response()->json([
                    'success' => true,
                    'repair_id' => $repairId,
                    'images' => [],
                    'total_images' => 0,
                ]);
            }

            $files = $disk->files($repairPath);
            $images = array_map(function ($file) use ($disk) {
                return [
                    'name' => basename($file),
                    'path' => $file,
                    'url' => $disk->url($file),
                ];
            }, $files);

            return response()->json([
                'success' => true,
                'repair_id' => $repairId,
                'images' => array_values($images),
                'total_images' => count($images),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las imágenes: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Eliminar una imagen específica
     *
     * @param string $repairId
     * @param string $fileName
     * @return JsonResponse
     */
    public function destroy(string $repairId, string $fileName): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $fileName = rawurldecode($fileName);
            $fileName = basename($fileName);
            $repairPath = "repairs/{$repairId}";
            $filePath = "{$repairPath}/{$fileName}";

            if (!$disk->exists($filePath)) {
                // Buscar coincidencias en el directorio en caso de diferencias en codificación o mayúsculas
                $files = $disk->files($repairPath);
                $targetBase = pathinfo($fileName, PATHINFO_FILENAME);
                foreach ($files as $file) {
                    $candidateName = basename($file);
                    $candidateBase = pathinfo($candidateName, PATHINFO_FILENAME);

                    // Coincidencia exacta o por nombre sin extensión (p. ej. .jpg vs .webp)
                    if ($candidateName === $fileName || mb_strtolower($candidateName) === mb_strtolower($fileName) || mb_strtolower($candidateBase) === mb_strtolower($targetBase)) {
                        $filePath = $file;
                        $fileName = $candidateName;
                        break;
                    }
                }
            }

            if (!$disk->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La imagen no existe',
                ], 404)->header('Content-Type', 'application/json');
            }

            // Eliminar archivo del disco
            $disk->delete($filePath);

            // Actualizar la base de datos para remover la imagen del array
            // Solo si el repairId es numérico (no UUID)
            if (is_numeric($repairId)) {
                try {
                    $repair = DeviceRepair::find($repairId);
                    if ($repair && $repair->images && is_array($repair->images)) {
                        // Filtrar el array para remover la imagen eliminada.
                        // Comparar por nombre sin extensión para cubrir cambios de extensión (jpg -> webp)
                        $targetBase = mb_strtolower(pathinfo($fileName, PATHINFO_FILENAME));
                        $updatedImages = array_filter(
                            $repair->images,
                            function ($img) use ($targetBase) {
                                $imgName = isset($img['name']) ? $img['name'] : '';
                                $imgBase = mb_strtolower(pathinfo($imgName, PATHINFO_FILENAME));
                                return $imgBase !== $targetBase;
                            }
                        );
                        // Reindiciar el array
                        $repair->images = array_values($updatedImages);
                        $repair->save();
                        \Log::info("Imagen removida del array DB", [
                            'repairId' => $repairId,
                            'fileName' => $fileName,
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error("Error actualizando DB después de eliminar imagen", [
                        'error' => $e->getMessage(),
                        'repairId' => $repairId,
                    ]);
                    // No fallar si hay error en DB, el archivo ya se eliminó
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Imagen eliminada exitosamente',
            ])->header('Content-Type', 'application/json');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la imagen: ' . $e->getMessage(),
            ], 500)->header('Content-Type', 'application/json');
        }
    }

    /**
     * Eliminar toda la carpeta de imágenes de una reparación
     * Usado cuando se cancela la creación de una reparación
     *
     * @param string $repairId
     * @return JsonResponse
     */
    public function destroyRepairFolder(string $repairId): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $repairPath = "repairs/{$repairId}";

            if (!$disk->exists($repairPath)) {
                return response()->json([
                    'success' => true,
                    'message' => 'La carpeta no existe o ya fue eliminada',
                ]);
            }

            // Eliminar todos los archivos de la carpeta
            $files = $disk->files($repairPath);
            foreach ($files as $file) {
                $disk->delete($file);
                \Log::info("Imagen eliminada", ['file' => $file]);
            }

            // Eliminar la carpeta
            $disk->deleteDirectory($repairPath);

            \Log::info("Carpeta de reparación eliminada", [
                'repairId' => $repairId,
                'repairPath' => $repairPath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Carpeta de reparación eliminada exitosamente',
            ]);

        } catch (\Exception $e) {
            \Log::error("Error eliminando carpeta de reparación", [
                'repairId' => $repairId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la carpeta: ' . $e->getMessage(),
            ], 500)->header('Content-Type', 'application/json');
        }
    }
}
