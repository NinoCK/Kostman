<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Environment;
use App\Models\Request;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTesterCollectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_tester_page_displays_user_collections(): void
    {
        $user = User::factory()->create();

        // Create collection manually since we don't have a factory yet
        $collection = Collection::create([
            'user_id' => $user->id,
            'name' => 'Test Collection',
            'description' => 'Test Description',
            'is_public' => false,
        ]);

        // Create request manually
        $request = Request::create([
            'collection_id' => $collection->id,
            'name' => 'Test Request',
            'method' => 'GET',
            'url' => 'https://api.example.com/test',
            'position' => 1,
        ]);

        // Create environment manually
        $environment = Environment::create([
            'user_id' => $user->id,
            'name' => 'Test Environment',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get('/api-tester');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('ApiTester')
            ->has('collections', 1)
            ->has('collections.0', fn ($collection) => $collection->has('id')
                ->has('name')
                ->has('description')
                ->has('is_public')
                ->has('created_at')
                ->has('updated_at')
                ->has('requests', 1)
                ->has('folders')
                ->has('requests.0', fn ($request) => $request->has('id')
                    ->has('name')
                    ->has('method')
                    ->has('url')
                    ->has('folder_id')
                )
            )
            ->has('environments', 1)
            ->has('environments.0', fn ($environment) => $environment->has('id')
                ->has('name')
                ->has('is_active')
                ->has('created_at')
                ->has('updated_at')
            )
        );
    }

    public function test_api_tester_page_works_with_empty_collections(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/api-tester');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('ApiTester')
            ->has('collections', 0)
            ->has('environments', 0)
        );
    }

    public function test_collections_data_structure_matches_dashboard(): void
    {
        $user = User::factory()->create();

        // Create collection manually since we don't have a factory yet
        $collection = Collection::create([
            'user_id' => $user->id,
            'name' => 'Test Collection',
            'description' => 'Test Description',
            'is_public' => false,
        ]);

        // Create request manually
        $request = Request::create([
            'collection_id' => $collection->id,
            'name' => 'Test Request',
            'method' => 'GET',
            'url' => 'https://api.example.com/test',
            'position' => 1,
        ]);

        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $apiTesterResponse = $this->actingAs($user)->get('/api-tester');

        $dashboardCollections = $dashboardResponse->getOriginalContent()->getData()['page']['props']['collections'];
        $apiTesterCollections = $apiTesterResponse->getOriginalContent()->getData()['page']['props']['collections'];

        // Both should have the same structure and data
        $this->assertEquals($dashboardCollections, $apiTesterCollections);
    }
}
