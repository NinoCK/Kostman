<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsModalTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_tester_page_loads_with_settings_modal_available(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/api-tester');

        $response->assertStatus(200);

        // Verify that the page loads successfully and user data is available for the modal
        $response->assertInertia(fn ($page) => $page->component('ApiTester')
            ->has('user')
        );
    }

    public function test_dashboard_page_loads_with_settings_modal_available(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);

        // Verify that the page loads successfully and user data is available for the modal
        $response->assertInertia(fn ($page) => $page->component('dashboard')
            ->has('user')
        );
    }

    public function test_profile_settings_endpoints_still_work_for_modal_backend(): void
    {
        $user = User::factory()->create();

        // Test profile update still works (this will be used by the modal)
        $response = $this->actingAs($user)
            ->patch('/settings/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ]);

        $response->assertRedirect();

        $user->refresh();
        $this->assertEquals('Updated Name', $user->name);
        $this->assertEquals('updated@example.com', $user->email);
    }

    public function test_password_update_endpoint_works_for_modal(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('current-password'),
        ]);

        $response = $this->actingAs($user)
            ->put('/settings/password', [
                'current_password' => 'current-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertRedirect();

        $user->refresh();
        $this->assertTrue(\Hash::check('new-password', $user->password));
    }

    public function test_old_settings_page_still_accessible_if_needed(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/settings/profile');

        $response->assertStatus(200);

        // The old settings page should still work but now it's mainly for direct access
        $response->assertInertia(fn ($page) => $page->component('settings/profile')
            ->has('user')
        );
    }
}
