<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ApiTesterEnhancementsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_api_tester_page_loads_with_enhanced_interface(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/api-tester');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('ApiTester')
            ->has('user')
            ->has('collections')
            ->has('environments')
        );
    }

    public function test_request_executor_handles_ssl_errors_gracefully(): void
    {
        // Mock an SSL error response
        Http::fake([
            '*' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('cURL error 60: SSL certificate problem: self signed certificate');
            },
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/requests/execute', [
                'method' => 'GET',
                'url' => 'https://self-signed.badssl.com/',
                'headers' => [
                    ['key' => 'Accept', 'value' => 'application/json', 'is_active' => true],
                ],
                'params' => [],
                'body' => null,
            ]);

        $response->assertStatus(500);
        $response->assertJson([
            'success' => false,
        ]);

        $responseData = $response->json();
        $this->assertStringContainsString('SSL certificate verification failed', $responseData['error']);
        $this->assertArrayHasKey('time', $responseData);
    }

    public function test_request_executor_handles_connection_errors(): void
    {
        Http::fake([
            '*' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('cURL error 6: Could not resolve host: nonexistent.domain');
            },
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/requests/execute', [
                'method' => 'GET',
                'url' => 'https://nonexistent.domain/api/test',
                'headers' => [],
                'params' => [],
                'body' => null,
            ]);

        $response->assertStatus(500);
        $response->assertJson([
            'success' => false,
        ]);

        $responseData = $response->json();
        $this->assertStringContainsString('Could not resolve host', $responseData['error']);
    }

    public function test_request_executor_handles_timeout_errors(): void
    {
        Http::fake([
            '*' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('cURL error 28: Operation timed out');
            },
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/requests/execute', [
                'method' => 'GET',
                'url' => 'https://httpbin.org/delay/10',
                'headers' => [],
                'params' => [],
                'body' => null,
            ]);

        $response->assertStatus(500);
        $response->assertJson([
            'success' => false,
        ]);

        $responseData = $response->json();
        $this->assertStringContainsString('Request timed out', $responseData['error']);
    }

    public function test_request_executor_handles_successful_requests(): void
    {
        Http::fake([
            'api.example.com/test' => Http::response([
                'message' => 'Success',
                'data' => ['id' => 1, 'name' => 'Test'],
            ], 200, ['Content-Type' => 'application/json']),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/requests/execute', [
                'method' => 'GET',
                'url' => 'https://api.example.com/test',
                'headers' => [
                    ['key' => 'Accept', 'value' => 'application/json', 'is_active' => true],
                ],
                'params' => [],
                'body' => null,
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'response' => [
                'status' => 200,
                'body' => '{"message":"Success","data":{"id":1,"name":"Test"}}',
            ],
        ]);
    }

    public function test_request_history_saves_error_details(): void
    {
        Http::fake([
            '*' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('cURL error 60: SSL certificate verification failed');
            },
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/requests/execute', [
                'method' => 'GET',
                'url' => 'https://self-signed.badssl.com/',
                'headers' => [],
                'params' => [],
                'body' => null,
            ]);

        $this->assertDatabaseHas('request_histories', [
            'user_id' => $this->user->id,
            'method' => 'GET',
            'url' => 'https://self-signed.badssl.com/',
            'response_status' => null,
        ]);

        $history = $this->user->requestHistories()->first();
        $this->assertNotNull($history);
        $this->assertStringContainsString('SSL certificate verification failed', $history->response_data['error']);
        $this->assertGreaterThan(0, $history->response_time);
    }
}
