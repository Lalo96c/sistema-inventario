<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\DeviceRepair;
use App\Models\Technician;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeviceRepair>
 */
class DeviceRepairFactory extends Factory
{
    protected $model = DeviceRepair::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;

        $devices = ['iPhone 12', 'Samsung Galaxy A12', 'iPhone 13 Pro', 'Samsung Galaxy S21', 'Xiaomi Redmi Note 10', 'Oppo A53', 'Vivo Y12'];
        $faults = ['Pantalla rota', 'Batería no carga', 'Botones no funcionan', 'Problema de audio', 'No enciende', 'Cámara dañada', 'Problema de conectividad'];
        $statuses = ['recibido', 'en_reparacion', 'reparado', 'entregado'];

        $counter++;
        $nextId = (int) DeviceRepair::query()->max('id') + $counter;

        return [
            'repair_code' => 'REP-' . str_pad((string) $nextId, 6, '0', STR_PAD_LEFT),
            'client_id' => Client::factory(),
            'technician_id' => fake()->randomElement([Technician::factory(), null]),
            'device_type' => fake()->randomElement(['Celular', 'Laptop', 'Tablet', 'Computadora', 'Otros']),
            'device_lock' => fake()->optional()->randomElement(['PIN 1234', 'PATRÓN', 'CONTRASEÑA 0000', null]),
            'device_description' => fake()->randomElement($devices),
            'fault_description' => fake()->randomElement($faults),
            'status' => fake()->randomElement($statuses),
            'total_amount' => fake()->randomFloat(2, 50, 5000),
            'receipt_number' => fake()->randomElement([fake()->numerify('BOL-####'), null]),
            'repair_notes' => fake()->randomElement([fake()->paragraph(), null]),
            'delivered_at' => fake()->randomElement([fake()->dateTimeBetween('-30 days', 'now'), null]),
        ];
    }
}
