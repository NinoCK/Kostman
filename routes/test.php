<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test/collections', function (Request $request) {
    $user = $request->user();

    $collections = $user->collections()
        ->with(['requests', 'folders.requests'])
        ->orderBy('updated_at', 'desc')
        ->get()
        ->map(function ($collection) {
            // Separate root requests (not in folders) from folder requests
            $allRequests = $collection->requests;
            $rootRequests = $allRequests->whereNull('folder_id');

            return [
                'id' => $collection->id,
                'name' => $collection->name,
                'description' => $collection->description,
                'is_public' => $collection->is_public,
                'created_at' => $collection->created_at->toISOString(),
                'updated_at' => $collection->updated_at->toISOString(),
                'root_requests' => $rootRequests->map(function ($request) {
                    return [
                        'id' => $request->id,
                        'name' => $request->name,
                        'method' => $request->method,
                        'url' => $request->url,
                        'description' => $request->description,
                        'position' => $request->position,
                    ];
                })->values(),
                'folders' => $collection->folders->map(function ($folder) {
                    return [
                        'id' => $folder->id,
                        'name' => $folder->name,
                        'description' => $folder->description,
                        'position' => $folder->position,
                        'requests' => $folder->requests->map(function ($request) {
                            return [
                                'id' => $request->id,
                                'name' => $request->name,
                                'method' => $request->method,
                                'url' => $request->url,
                                'description' => $request->description,
                                'position' => $request->position,
                            ];
                        }),
                    ];
                }),
            ];
        });

    return response()->json([
        'collections' => $collections,
        'user' => $user->only(['id', 'name', 'email']),
    ]);
});
