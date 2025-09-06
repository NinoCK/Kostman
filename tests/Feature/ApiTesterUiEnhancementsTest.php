<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTesterUiEnhancementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_fetch_collections_for_saving_requests(): void
    {
        $user = User::factory()->create();

        // Create some collections
        $collection1 = Collection::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Collection 1',
        ]);

        $collection2 = Collection::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Collection 2',
        ]);

        $response = $this->actingAs($user)->getJson('/api/collections');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'collections' => [
                    '*' => ['id', 'name', 'description', 'user_id'],
                ],
            ])
            ->assertJsonCount(2, 'collections');
    }

    public function test_user_can_save_request_to_collection(): void
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        $requestData = [
            'collection_id' => $collection->id,
            'name' => 'Test API Request',
            'method' => 'GET',
            'url' => 'https://api.example.com/users',
            'description' => 'Test request description',
            'headers' => [
                ['key' => 'Accept', 'value' => 'application/json', 'is_active' => true],
                ['key' => 'User-Agent', 'value' => 'Kostman-API-Tester/1.0', 'is_active' => true],
            ],
            'params' => [
                ['key' => 'limit', 'value' => '10', 'is_active' => true],
            ],
            'body' => '{"test": "data"}',
        ];

        $response = $this->actingAs($user)->postJson('/api/requests', $requestData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'request' => [
                    'id', 'name', 'method', 'url', 'description',
                    'headers' => [
                        '*' => ['key', 'value', 'is_active'],
                    ],
                    'params' => [
                        '*' => ['key', 'value', 'is_active'],
                    ],
                    'body' => ['content'],
                ],
            ]);

        $this->assertDatabaseHas('requests', [
            'collection_id' => $collection->id,
            'name' => 'Test API Request',
            'method' => 'GET',
            'url' => 'https://api.example.com/users',
        ]);
    }

    public function test_api_tester_page_loads_with_enhanced_ui(): void
    {
        $user = User::factory()->create();
        Collection::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get('/api-tester');

        $response->assertStatus(200);

        // For Inertia, we need to check the response differently
        $this->assertArrayHasKey('collections', $response->original->getData()['page']['props']);
    }

    public function test_cannot_save_request_to_collection_belonging_to_another_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherCollection = Collection::factory()->create(['user_id' => $otherUser->id]);

        $requestData = [
            'collection_id' => $otherCollection->id,
            'name' => 'Test Request',
            'method' => 'GET',
            'url' => 'https://api.example.com/test',
        ];

        $response = $this->actingAs($user)->postJson('/api/requests', $requestData);

        $response->assertStatus(404); // Collection not found for this user
    }
}
