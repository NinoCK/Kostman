<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Request as RequestModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequestController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'collection_id' => 'required|exists:collections,id',
            'name' => 'required|string|max:255',
            'method' => 'required|string|in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
            'url' => 'required|string|max:2048',
            'description' => 'nullable|string|max:1000',
            'headers' => 'array',
            'headers.*.key' => 'required|string',
            'headers.*.value' => 'required|string',
            'headers.*.is_active' => 'boolean',
            'params' => 'array',
            'params.*.key' => 'required|string',
            'params.*.value' => 'required|string',
            'params.*.is_active' => 'boolean',
            'body' => 'nullable|string',
        ]);

        // Verify the collection belongs to the user
        $collection = Collection::where('id', $validated['collection_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Create the request
        $savedRequest = $collection->requests()->create([
            'name' => $validated['name'],
            'method' => $validated['method'],
            'url' => $validated['url'],
            'description' => $validated['description'] ?? null,
        ]);

        // Save headers
        if (! empty($validated['headers'])) {
            foreach ($validated['headers'] as $header) {
                if (! empty($header['key'])) {
                    $savedRequest->headers()->create([
                        'key' => $header['key'],
                        'value' => $header['value'],
                        'is_active' => $header['is_active'] ?? true,
                    ]);
                }
            }
        }

        // Save parameters
        if (! empty($validated['params'])) {
            foreach ($validated['params'] as $param) {
                if (! empty($param['key'])) {
                    $savedRequest->params()->create([
                        'key' => $param['key'],
                        'value' => $param['value'],
                        'is_active' => $param['is_active'] ?? true,
                    ]);
                }
            }
        }

        // Save body
        if (! empty($validated['body'])) {
            $savedRequest->body()->create([
                'content' => $validated['body'],
            ]);
        }

        return response()->json([
            'message' => 'Request saved successfully',
            'request' => $savedRequest->load(['headers', 'params', 'body']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, RequestModel $savedRequest): JsonResponse
    {
        // Ensure the request belongs to the user
        $this->authorize('view', $savedRequest);

        return response()->json([
            'request' => $savedRequest->load(['headers', 'params', 'body', 'collection']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RequestModel $savedRequest): JsonResponse
    {
        // Ensure the request belongs to the user
        $this->authorize('update', $savedRequest);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'method' => 'required|string|in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
            'url' => 'required|string|max:2048',
            'description' => 'nullable|string|max:1000',
            'headers' => 'array',
            'headers.*.key' => 'required|string',
            'headers.*.value' => 'required|string',
            'headers.*.is_active' => 'boolean',
            'params' => 'array',
            'params.*.key' => 'required|string',
            'params.*.value' => 'required|string',
            'params.*.is_active' => 'boolean',
            'body' => 'nullable|string',
        ]);

        // Update the request
        $savedRequest->update([
            'name' => $validated['name'],
            'method' => $validated['method'],
            'url' => $validated['url'],
            'description' => $validated['description'] ?? null,
        ]);

        // Update headers
        $savedRequest->headers()->delete();
        if (! empty($validated['headers'])) {
            foreach ($validated['headers'] as $header) {
                if (! empty($header['key'])) {
                    $savedRequest->headers()->create([
                        'key' => $header['key'],
                        'value' => $header['value'],
                        'is_active' => $header['is_active'] ?? true,
                    ]);
                }
            }
        }

        // Update parameters
        $savedRequest->params()->delete();
        if (! empty($validated['params'])) {
            foreach ($validated['params'] as $param) {
                if (! empty($param['key'])) {
                    $savedRequest->params()->create([
                        'key' => $param['key'],
                        'value' => $param['value'],
                        'is_active' => $param['is_active'] ?? true,
                    ]);
                }
            }
        }

        // Update body
        $savedRequest->body()->delete();
        if (! empty($validated['body'])) {
            $savedRequest->body()->create([
                'content' => $validated['body'],
            ]);
        }

        return response()->json([
            'message' => 'Request updated successfully',
            'request' => $savedRequest->fresh()->load(['headers', 'params', 'body']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, RequestModel $savedRequest): JsonResponse
    {
        // Ensure the request belongs to the user
        $this->authorize('delete', $savedRequest);

        $savedRequest->delete();

        return response()->json([
            'message' => 'Request deleted successfully',
        ]);
    }

    /**
     * Duplicate the specified resource.
     */
    public function duplicate(Request $request, RequestModel $originalRequest): JsonResponse
    {
        // Ensure the original request belongs to the user
        $this->authorize('view', $originalRequest);

        $originalRequest->load(['headers', 'params', 'body']);

        // Create a duplicate
        $duplicateRequest = $originalRequest->collection->requests()->create([
            'name' => $originalRequest->name.' (Copy)',
            'method' => $originalRequest->method,
            'url' => $originalRequest->url,
            'description' => $originalRequest->description,
            'folder_id' => $originalRequest->folder_id,
        ]);

        // Duplicate headers
        foreach ($originalRequest->headers as $header) {
            $duplicateRequest->headers()->create([
                'key' => $header->key,
                'value' => $header->value,
                'is_active' => $header->is_active,
            ]);
        }

        // Duplicate parameters
        foreach ($originalRequest->params as $param) {
            $duplicateRequest->params()->create([
                'key' => $param->key,
                'value' => $param->value,
                'is_active' => $param->is_active,
            ]);
        }

        // Duplicate body
        if ($originalRequest->body) {
            $duplicateRequest->body()->create([
                'content' => $originalRequest->body->content,
            ]);
        }

        return response()->json([
            'message' => 'Request duplicated successfully',
            'request' => $duplicateRequest->load(['headers', 'params', 'body']),
        ], 201);
    }
}
