<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Request;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_dashboard_displays_collections_with_requests()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->for($user)->create(['name' => 'Test Collection']);
        $request = Request::create([
            'collection_id' => $collection->id,
            'name' => 'Test Request',
            'method' => 'GET',
            'url' => 'https://api.example.com/test',
            'position' => 1,
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();

        // Check that the Inertia response contains collections with root_requests
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('collections', 1)
            ->where('collections.0.name', 'Test Collection')
            ->has('collections.0.root_requests', 1)
            ->where('collections.0.root_requests.0.name', 'Test Request')
            ->where('collections.0.root_requests.0.method', 'GET')
            ->where('collections.0.root_requests.0.url', 'https://api.example.com/test')
        );
    }
}
