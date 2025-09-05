<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Collection;
use App\Models\Environment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create test user
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create a default collection
        if (!$user->collections()->exists()) {
            $collection = $user->collections()->create([
                'name' => 'My First Collection',
                'description' => 'A sample collection to get started',
                'is_public' => false,
            ]);

            // Create a sample request
            $request = $collection->requests()->create([
                'name' => 'Sample GET Request',
                'method' => 'GET',
                'url' => 'https://jsonplaceholder.typicode.com/posts/1',
                'description' => 'A sample GET request to test the API',
                'position' => 1,
            ]);

            // Add sample headers
            $request->headers()->create([
                'key' => 'Content-Type',
                'value' => 'application/json',
                'is_active' => true,
            ]);
        }

        // Create default environments
        if (!$user->environments()->exists()) {
            $devEnv = $user->environments()->create([
                'name' => 'Development',
                'is_active' => true,
            ]);

            $devEnv->variables()->create([
                'key' => 'base_url',
                'initial_value' => 'https://api-dev.example.com',
                'current_value' => 'https://api-dev.example.com',
                'is_secret' => false,
            ]);

            $prodEnv = $user->environments()->create([
                'name' => 'Production',
                'is_active' => false,
            ]);

            $prodEnv->variables()->create([
                'key' => 'base_url',
                'initial_value' => 'https://api.example.com',
                'current_value' => 'https://api.example.com',
                'is_secret' => false,
            ]);
        }
    }
}
