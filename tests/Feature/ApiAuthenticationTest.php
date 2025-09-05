<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ApiAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_access_collections_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/collections');

        $response->assertOk()
            ->assertJson([
                'collections' => []
            ]);
    }

    public function test_authenticated_user_can_access_environments_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/environments');

        $response->assertOk()
            ->assertJson([
                'environments' => []
            ]);
    }

    public function test_authenticated_user_can_access_history_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/history');

        $response->assertOk()
            ->assertJson([
                'history' => []
            ]);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/collections');
        $response->assertUnauthorized();

        $response = $this->getJson('/api/environments');
        $response->assertUnauthorized();

        $response = $this->getJson('/api/history');
        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_collection(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $collectionData = [
            'name' => 'Test Collection',
            'description' => 'A test collection for API testing',
            'is_public' => false
        ];

        $response = $this->postJson('/api/collections', $collectionData);

        $response->assertCreated()
            ->assertJson([
                'collection' => [
                    'name' => 'Test Collection',
                    'description' => 'A test collection for API testing',
                    'is_public' => false,
                    'user_id' => $user->id
                ]
            ]);

        $this->assertDatabaseHas('collections', [
            'name' => 'Test Collection',
            'user_id' => $user->id
        ]);
    }

    public function test_authenticated_user_can_create_environment(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $environmentData = [
            'name' => 'Development'
        ];

        $response = $this->postJson('/api/environments', $environmentData);

        $response->assertCreated()
            ->assertJson([
                'environment' => [
                    'name' => 'Development',
                    'user_id' => $user->id,
                    'is_active' => false
                ]
            ]);

        $this->assertDatabaseHas('environments', [
            'name' => 'Development',
            'user_id' => $user->id
        ]);
    }
}
