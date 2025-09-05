<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as ApiRequest;
use App\Models\RequestHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

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

        $startTime = microtime(true);
        
        try {
            $httpClient = Http::timeout(30);
            
            // Add headers
            if (!empty($validated['headers'])) {
                foreach ($validated['headers'] as $header) {
                    if ($header['is_active'] ?? true) {
                        $httpClient = $httpClient->withHeader($header['key'], $header['value']);
                    }
                }
            }

            // Prepare request data
            $requestData = [];
            $contentType = $validated['body']['type'] ?? 'json';

            if (!empty($validated['body']['content'])) {
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
            if (!empty($validated['params'])) {
                $activeParams = array_filter($validated['params'], fn($param) => $param['is_active'] ?? true);
                $queryParams = [];
                foreach ($activeParams as $param) {
                    $queryParams[$param['key']] = $param['value'];
                }
                if (!empty($queryParams)) {
                    $url .= '?' . http_build_query($queryParams);
                }
            }

            // Execute request
            $response = match(strtoupper($validated['method'])) {
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

        } catch (\Exception $e) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000);

            // Save error to history
            $request->user()->requestHistories()->create([
                'method' => strtoupper($validated['method']),
                'url' => $validated['url'],
                'request_data' => $validated,
                'response_data' => ['error' => $e->getMessage()],
                'response_time' => $responseTime,
                'response_status' => null,
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'time' => $responseTime,
            ], 500);
        }
    }

    public function executeRequest(Request $request, ApiRequest $apiRequest): JsonResponse
    {
        // Load the saved request with all its data
        $apiRequest->load(['headers', 'params', 'body']);
        
        // Convert to execution format
        $requestData = [
            'method' => $apiRequest->method,
            'url' => $apiRequest->url,
            'headers' => $apiRequest->headers->map(fn($h) => [
                'key' => $h->key, 
                'value' => $h->value, 
                'is_active' => $h->is_active
            ])->toArray(),
            'params' => $apiRequest->params->map(fn($p) => [
                'key' => $p->key, 
                'value' => $p->value, 
                'is_active' => $p->is_active
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
