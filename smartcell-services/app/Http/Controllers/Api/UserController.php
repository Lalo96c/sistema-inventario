<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    private function ensureAdmin(): ?User
    {
        $user = auth('api')->user();

        if (! $user || ! $user->is_admin) {
            return null;
        }

        return $user;
    }

    public function index(Request $request): JsonResponse
    {
        if (! $this->ensureAdmin()) {
            return response()->json(['message' => 'Solo un administrador puede administrar usuarios.'], 403);
        }

        $users = User::query()
            ->select(['id', 'name', 'email', 'is_admin', 'is_active', 'created_at', 'updated_at'])
            ->orderByDesc('id')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->ensureAdmin()) {
            return response()->json(['message' => 'Solo un administrador puede crear usuarios.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
            'is_admin' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'is_admin' => (bool) ($data['is_admin'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return response()->json($user->only(['id', 'name', 'email', 'is_admin', 'is_active', 'created_at', 'updated_at']), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if (! $this->ensureAdmin()) {
            return response()->json(['message' => 'Solo un administrador puede administrar usuarios.'], 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['sometimes', 'nullable', 'string', Password::min(8), 'confirmed'],
            'is_admin' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('password', $data) && $data['password'] !== null) {
            $data['password'] = $data['password'];
        }

        $user->fill($data);
        $user->save();

        return response()->json($user->only(['id', 'name', 'email', 'is_admin', 'is_active', 'created_at', 'updated_at']));
    }

    public function destroy(User $user): JsonResponse
    {
        if (! $this->ensureAdmin()) {
            return response()->json(['message' => 'Solo un administrador puede administrar usuarios.'], 403);
        }

        if ($user->id === auth('api')->id()) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado.'], 200);
    }
}
