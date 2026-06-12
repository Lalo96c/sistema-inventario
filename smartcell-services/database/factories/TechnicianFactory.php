<?php

namespace Database\Factories;

use App\Models\Technician;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Technician>
 */
class TechnicianFactory extends Factory
{
    protected $model = Technician::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $specialties = ['Reparación de pantallas', 'Reparación de baterías', 'Reparación de circuitos', 'Reparación general', 'Diagnóstico'];

        return [
            'name' => fake()->firstName() . ' ' . fake()->lastName(),
            'dni' => fake()->numerify('########'),
            'specialty' => fake()->randomElement($specialties),
            'phone' => fake()->phoneNumber(),
            'status' => fake()->randomElement(['activo', 'inactivo']),
        ];
    }
}
