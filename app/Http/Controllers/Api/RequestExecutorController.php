<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as ApiRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RequestExecutorController extends Controller
{
    public function execute(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'method' => 'required|string|in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
            'url' => 'required|url',
            'headers' => 'nullable|array',
            'params' => 'nullable|array',
            'body' => 'nullable|array',
            'body.type' => 'nullable|string|in:json,form-data,x-www-form-urlencoded,raw,binary',
            'body.content' => 'nullable|string',
        ]);

        // Debug logging
        \Log::info('Execute request called', [
            'method' => $validated['method'],
            'url' => $validated['url'],
            'headers_count' => count($validated['headers'] ?? []),
            'params_count' => count($validated['params'] ?? []),
        ]);

        $startTime = microtime(true);

        try {
            // Configure HTTP client with enhanced error handling and explicit SSL settings
            $httpClient = Http::timeout(30)
                ->withHeaders([
                    'Accept-Encoding' => 'gzip, deflate', // Explicitly exclude Brotli (br)
                ])
                ->withOptions([
                    'verify' => false, // Disable SSL verification for development/testing
                    'curl' => [
                        CURLOPT_SSL_VERIFYPEER => false,
                        CURLOPT_SSL_VERIFYHOST => false,
                        CURLOPT_TIMEOUT => 30,
                        CURLOPT_CONNECTTIMEOUT => 10,
                        CURLOPT_FOLLOWLOCATION => true,
                        CURLOPT_MAXREDIRS => 5,
                        CURLOPT_ENCODING => 'gzip, deflate', // Match the header
                        CURLOPT_USERAGENT => 'Kostman-API-Tester/1.0',
                    ],
                    'allow_redirects' => [
                        'max' => 5,
                        'strict' => false,
                        'referer' => true,
                        'protocols' => ['http', 'https'],
                        'track_redirects' => true,
                    ],
                    'connect_timeout' => 10,
                    'read_timeout' => 30,
                    'timeout' => 30,
                ])
                ->retry(2, 1000, function ($exception) {
                    // Only retry on connection errors, not client/server errors
                    return $exception instanceof \Illuminate\Http\Client\ConnectionException;
                });

            // Add default headers for better compatibility
            $httpClient = $httpClient
                ->withHeaders([
                    'Accept' => 'application/json, text/plain, */*',
                    'Accept-Encoding' => 'gzip, deflate, br',
                    'Accept-Language' => 'en-US,en;q=0.9',
                    'Cache-Control' => 'no-cache',
                    'Connection' => 'keep-alive',
                    'User-Agent' => 'Kostman-API-Tester/1.0 (Laravel HTTP Client)',
                ]);

            // Add headers
            if (! empty($validated['headers'])) {
                foreach ($validated['headers'] as $header) {
                    if ($header['is_active'] ?? true) {
                        $httpClient = $httpClient->withHeader($header['key'], $header['value']);
                    }
                }
            }

            // Prepare request data
            $requestData = [];
            $contentType = $validated['body']['type'] ?? 'json';

            if (! empty($validated['body']['content'])) {
                switch ($contentType) {
                    case 'json':
                        $requestData = json_decode($validated['body']['content'], true) ?? [];
                        break;
                    case 'x-www-form-urlencoded':
                        parse_str($validated['body']['content'], $requestData);
                        break;
                    case 'raw':
                        $httpClient = $httpClient->withBody($validated['body']['content'], 'text/plain');
                        break;
                }
            }

            // Build URL with query parameters
            $url = $validated['url'];
            if (! empty($validated['params'])) {
                $activeParams = array_filter($validated['params'], fn ($param) => $param['is_active'] ?? true);
                $queryParams = [];
                foreach ($activeParams as $param) {
                    $queryParams[$param['key']] = $param['value'];
                }
                if (! empty($queryParams)) {
                    $url .= '?'.http_build_query($queryParams);
                }
            }

            // Execute request
            $response = match (strtoupper($validated['method'])) {
                'GET' => $httpClient->get($url),
                'POST' => $httpClient->post($url, $requestData),
                'PUT' => $httpClient->put($url, $requestData),
                'PATCH' => $httpClient->patch($url, $requestData),
                'DELETE' => $httpClient->delete($url, $requestData),
                'HEAD' => $httpClient->head($url),
                'OPTIONS' => $httpClient->send('OPTIONS', $url),
            };

            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000); // Convert to milliseconds

            $responseData = [
                'status' => $response->status(),
                'headers' => $response->headers(),
                'body' => $response->body(),
                'time' => $responseTime,
                'size' => strlen($response->body()),
            ];

            // Save to history
            $request->user()->requestHistories()->create([
                'method' => strtoupper($validated['method']),
                'url' => $validated['url'],
                'request_data' => $validated,
                'response_data' => $responseData,
                'response_time' => $responseTime,
                'response_status' => $response->status(),
            ]);

            return response()->json([
                'success' => true,
                'response' => $responseData,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000);

            // Debug logging with full exception details
            \Log::error('Connection Exception caught', [
                'error' => $e->getMessage(),
                'url' => $validated['url'],
                'method' => $validated['method'],
                'exception_class' => get_class($e),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            // Parse connection errors for better user feedback
            $errorMessage = $this->parseConnectionError($e->getMessage());

            // Save error to history
            $request->user()->requestHistories()->create([
                'method' => strtoupper($validated['method']),
                'url' => $validated['url'],
                'request_data' => $validated,
                'response_data' => ['error' => $errorMessage],
                'response_time' => $responseTime,
                'response_status' => null,
            ]);

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'time' => $responseTime,
            ], 500);

        } catch (\Illuminate\Http\Client\RequestException $e) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000);

            $errorMessage = "HTTP {$e->response->status()}: ".$e->response->reason();
            if ($e->response->body()) {
                $errorMessage .= ' - '.substr($e->response->body(), 0, 200);
            }

            // Save error to history
            $request->user()->requestHistories()->create([
                'method' => strtoupper($validated['method']),
                'url' => $validated['url'],
                'request_data' => $validated,
                'response_data' => [
                    'error' => $errorMessage,
                    'status' => $e->response->status(),
                    'headers' => $e->response->headers(),
                    'body' => $e->response->body(),
                ],
                'response_time' => $responseTime,
                'response_status' => $e->response->status(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'response' => [
                    'status' => $e->response->status(),
                    'headers' => $e->response->headers(),
                    'body' => $e->response->body(),
                    'time' => $responseTime,
                ],
                'time' => $responseTime,
            ], 500);

        } catch (\Exception $e) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000);

            // Debug logging
            \Log::error('General Exception caught', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'url' => $validated['url'] ?? 'unknown',
                'method' => $validated['method'] ?? 'unknown',
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $errorMessage = $this->parseGenericError($e->getMessage());

            // Save error to history
            $request->user()->requestHistories()->create([
                'method' => strtoupper($validated['method']),
                'url' => $validated['url'],
                'request_data' => $validated,
                'response_data' => ['error' => $errorMessage],
                'response_time' => $responseTime,
                'response_status' => null,
            ]);

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'time' => $responseTime,
            ], 500);
        }
    }

    /**
     * Parse connection errors for user-friendly messages
     */
    private function parseConnectionError(string $errorMessage): string
    {
        // Check specific cURL errors in order of specificity (most specific first)
        if (str_contains($errorMessage, 'cURL error 61')) {
            return 'Content encoding error. The server is using an unsupported compression format.';
        }

        if (str_contains($errorMessage, 'cURL error 60')) {
            return 'SSL certificate verification failed. The remote server\'s SSL certificate could not be verified. This commonly occurs with self-signed certificates or expired SSL certificates.';
        }

        if (str_contains($errorMessage, 'cURL error 6:')) {
            return 'Could not resolve host. Please check if the domain name is correct and your internet connection is working.';
        }

        if (str_contains($errorMessage, 'cURL error 7')) {
            return 'Failed to connect to server. The server may be down, the port may be blocked, or the URL may be incorrect.';
        }

        if (str_contains($errorMessage, 'cURL error 28')) {
            return 'Request timed out. The server took too long to respond. Please try again or check if the server is responsive.';
        }

        if (str_contains($errorMessage, 'cURL error 35')) {
            return 'SSL connect error. There was a problem establishing an SSL/TLS connection to the server.';
        }

        if (str_contains($errorMessage, 'cURL error 51')) {
            return 'SSL peer certificate was not OK. The server\'s SSL certificate is not trusted.';
        }

        if (str_contains($errorMessage, 'cURL error 58')) {
            return 'Problem with the local SSL certificate. There may be an issue with your local certificate configuration.';
        }

        // Return the original message if no specific pattern matches
        return 'Connection error: '.$errorMessage;
    }

    /**
     * Parse generic errors for user-friendly messages
     */
    private function parseGenericError(string $errorMessage): string
    {
        if (str_contains($errorMessage, 'timeout')) {
            return 'Request timeout. The operation took too long to complete.';
        }

        if (str_contains($errorMessage, 'JSON')) {
            return 'Invalid JSON data. Please check your request body format.';
        }

        if (str_contains($errorMessage, 'URL')) {
            return 'Invalid URL format. Please check the URL and try again.';
        }

        return $errorMessage;
    }

    public function executeRequest(Request $request, ApiRequest $apiRequest): JsonResponse
    {
        // Load the saved request with all its data
        $apiRequest->load(['headers', 'params', 'body']);

        // Convert to execution format
        $requestData = [
            'method' => $apiRequest->method,
            'url' => $apiRequest->url,
            'headers' => $apiRequest->headers->map(fn ($h) => [
                'key' => $h->key,
                'value' => $h->value,
                'is_active' => $h->is_active,
            ])->toArray(),
            'params' => $apiRequest->params->map(fn ($p) => [
                'key' => $p->key,
                'value' => $p->value,
                'is_active' => $p->is_active,
            ])->toArray(),
            'body' => $apiRequest->body ? [
                'type' => $apiRequest->body->type,
                'content' => $apiRequest->body->content,
            ] : null,
        ];

        // Create a new request with the data and execute
        $executeRequest = new Request($requestData);
        $executeRequest->setUserResolver($request->getUserResolver());

        return $this->execute($executeRequest);
    }
}
