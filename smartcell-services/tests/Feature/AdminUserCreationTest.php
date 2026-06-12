<?php

use App\Models\User;

it('bloquea el registro público', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Usuario externo',
        'email' => 'externo@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertStatus(403);
});

it('solo un administrador puede crear usuarios', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user, 'api')
        ->postJson('/api/auth/register', [
            'name' => 'Nuevo usuario',
            'email' => 'nuevo@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
        ->assertStatus(403);

    $this->actingAs($admin, 'api')
        ->postJson('/api/auth/register', [
            'name' => 'Nuevo usuario',
            'email' => 'nuevo2@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
        ->assertStatus(201);
});
