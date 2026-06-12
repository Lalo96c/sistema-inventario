<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ProductSeeder::class,
            ClientSeeder::class,
            TechnicianSeeder::class,
            SaleSeeder::class,
            DeviceRepairSeeder::class,
            PurchaseSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
