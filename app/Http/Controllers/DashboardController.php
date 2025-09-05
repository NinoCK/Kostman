<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Get user's collections for sidebar
        $collections = $user->collections()
            ->with(['requests', 'folders.requests'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'name' => $collection->name,
                    'description' => $collection->description,
                    'is_public' => $collection->is_public,
                    'created_at' => $collection->created_at->toISOString(),
                    'updated_at' => $collection->updated_at->toISOString(),
                    'requests' => $collection->requests->map(function ($request) {
                        return [
                            'id' => $request->id,
                            'name' => $request->name,
                            'method' => $request->method,
                            'url' => $request->url,
                            'folder_id' => $request->folder_id,
                        ];
                    }),
                    'folders' => $collection->folders->map(function ($folder) {
                        return [
                            'id' => $folder->id,
                            'name' => $folder->name,
                            'requests' => $folder->requests->map(function ($request) {
                                return [
                                    'id' => $request->id,
                                    'name' => $request->name,
                                    'method' => $request->method,
                                    'url' => $request->url,
                                ];
                            }),
                        ];
                    }),
                ];
            });

        // Get user's environments
        $environments = $user->environments()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($environment) {
                return [
                    'id' => $environment->id,
                    'name' => $environment->name,
                    'is_active' => $environment->is_active,
                    'created_at' => $environment->created_at->toISOString(),
                    'updated_at' => $environment->updated_at->toISOString(),
                ];
            });
        
        // Get dashboard statistics
        $stats = [
            'total_collections' => $collections->count(),
            'total_requests' => $collections->sum(fn($c) => count($c['requests'])),
            'total_environments' => $environments->count(),
            'requests_this_week' => $user->requestHistories()
                ->where('created_at', '>=', Carbon::now()->startOfWeek())
                ->count(),
            'recent_collections' => $collections->take(5)->map(function ($collection) {
                return [
                    'id' => $collection['id'],
                    'name' => $collection['name'],
                    'request_count' => count($collection['requests']),
                    'updated_at' => $collection['updated_at'],
                ];
            }),
            'recent_history' => $user->requestHistories()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($history) {
                    return [
                        'id' => $history->id,
                        'method' => $history->method,
                        'url' => $history->url,
                        'response_status' => $history->response_status ?? 0,
                        'response_time' => $history->response_time ?? 0,
                        'created_at' => $history->created_at->toISOString(),
                    ];
                }),
        ];

        return Inertia::render('dashboard', [
            'user' => $user,
            'stats' => $stats,
            'collections' => $collections,
            'environments' => $environments,
        ]);
    }

    public function apiTester(Request $request): Response
    {
        $user = $request->user();
        
        // Get user's collections for sidebar (reuse same logic as dashboard)
        $collections = $user->collections()
            ->with(['requests', 'folders.requests'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'name' => $collection->name,
                    'description' => $collection->description,
                    'is_public' => $collection->is_public,
                    'created_at' => $collection->created_at->toISOString(),
                    'updated_at' => $collection->updated_at->toISOString(),
                    'requests' => $collection->requests->map(function ($request) {
                        return [
                            'id' => $request->id,
                            'name' => $request->name,
                            'method' => $request->method,
                            'url' => $request->url,
                            'folder_id' => $request->folder_id,
                        ];
                    }),
                    'folders' => $collection->folders->map(function ($folder) {
                        return [
                            'id' => $folder->id,
                            'name' => $folder->name,
                            'requests' => $folder->requests->map(function ($request) {
                                return [
                                    'id' => $request->id,
                                    'name' => $request->name,
                                    'method' => $request->method,
                                    'url' => $request->url,
                                ];
                            }),
                        ];
                    }),
                ];
            });

        // Get user's environments
        $environments = $user->environments()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($environment) {
                return [
                    'id' => $environment->id,
                    'name' => $environment->name,
                    'is_active' => $environment->is_active,
                    'created_at' => $environment->created_at->toISOString(),
                    'updated_at' => $environment->updated_at->toISOString(),
                ];
            });

        return Inertia::render('ApiTester', [
            'user' => $user,
            'collections' => $collections,
            'environments' => $environments,
        ]);
    }
}
