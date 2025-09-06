<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Session;
use Tests\TestCase;

class LogoutTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_logout_successfully(): void
    {
        $user = User::factory()->create();

        // Login the user
        $this->actingAs($user);

        // Make sure we're authenticated
        $this->assertAuthenticated();

        // Logout
        $response = $this->post('/logout');

        // Should redirect after logout
        $response->assertRedirect('/');

        // Should be logged out
        $this->assertGuest();
    }

    public function test_api_requests_fail_gracefully_when_session_invalidated(): void
    {
        $user = User::factory()->create();

        // Login the user
        $this->actingAs($user);

        // Make sure we can access API endpoints while authenticated
        $response = $this->get('/api/collections');
        $response->assertStatus(200);

        // Manually invalidate session (simulating what happens during logout)
        Session::invalidate();

        // API request should now fail with 401
        $response = $this->get('/api/collections');
        $response->assertStatus(401);
    }

    public function test_csrf_token_regeneration_during_logout(): void
    {
        $user = User::factory()->create();

        // Login the user
        $this->actingAs($user);

        // Get initial CSRF token
        $initialToken = csrf_token();

        // Logout
        $response = $this->post('/logout');

        // Should redirect
        $response->assertRedirect('/');

        // Get new CSRF token (should be different)
        $newToken = csrf_token();

        // Tokens should be different after session regeneration
        $this->assertNotEquals($initialToken, $newToken);
    }
}
