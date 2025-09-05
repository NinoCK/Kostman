<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\SharedCollection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $collections = $request->user()
            ->collections()
            ->with(['folders.requests', 'rootRequests'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['collections' => $collections]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $collection = $request->user()->collections()->create($validated);

        return response()->json([
            'collection' => $collection->load(['folders.requests', 'rootRequests']),
        ], 201);
    }

    public function show(Request $request, Collection $collection): JsonResponse
    {
        return response()->json([
            'collection' => $collection->load([
                'folders.requests.headers',
                'folders.requests.params', 
                'folders.requests.body',
                'rootRequests.headers',
                'rootRequests.params',
                'rootRequests.body'
            ]),
        ]);
    }

    public function update(Request $request, Collection $collection): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $collection->update($validated);

        return response()->json([
            'collection' => $collection->fresh(['folders.requests', 'rootRequests']),
        ]);
    }

    public function destroy(Collection $collection): JsonResponse
    {
        $collection->delete();
        return response()->json(['message' => 'Collection deleted successfully']);
    }

    public function share(Request $request, Collection $collection): JsonResponse
    {
        $validated = $request->validate(['expires_at' => 'nullable|date|after:now']);

        $sharedCollection = $collection->sharedCollection()->updateOrCreate(
            ['collection_id' => $collection->id],
            [
                'share_token' => Str::random(32),
                'expires_at' => $validated['expires_at'] ?? null,
            ]
        );

        return response()->json([
            'shared_collection' => $sharedCollection,
            'share_url' => url("/api/shared/{$sharedCollection->share_token}"),
        ]);
    }

    public function showShared(string $token): JsonResponse
    {
        $sharedCollection = SharedCollection::where('share_token', $token)
            ->with(['collection.folders.requests', 'collection.rootRequests'])
            ->firstOrFail();

        if ($sharedCollection->isExpired()) {
            abort(404, 'Shared collection has expired');
        }

        return response()->json([
            'collection' => $sharedCollection->collection,
            'shared_at' => $sharedCollection->created_at,
            'expires_at' => $sharedCollection->expires_at,
        ]);
    }
}
