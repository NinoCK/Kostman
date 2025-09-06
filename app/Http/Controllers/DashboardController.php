<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with user statistics and collections.
     */
    public function index()
    {
        $user = auth()->user();

        $collections = $user->collections()
            ->withCount(['requests', 'folders'])
            ->with(['requests' => function ($query) {
                $query->whereNull('folder_id')
                    ->with(['headers', 'params']);
            }, 'folders' => function ($query) {
                $query->with(['requests' => function ($subquery) {
                    $subquery->with(['headers', 'params']);
                }]);
            }])
            ->get()
            ->map(function ($collection) {
                $collection->root_requests = $collection->requests;

                return $collection;
            });

        return Inertia::render('dashboard', [
            'collections' => $collections,
            'user' => $user,
            'stats' => [
                'total_collections' => $user->collections()->count(),
                'total_requests' => $user->collections()->withCount('requests')->get()->sum('requests_count'),
                'total_environments' => $user->environments()->count(),
                'requests_this_week' => 0, // You can implement this later
                'recent_collections' => [],
                'recent_history' => [],
            ],
        ]);
    }

    /**
     * Display the API Tester page with full request details.
     */
    public function apiTester()
    {
        $user = auth()->user();

        $collections = $user->collections()
            ->withCount(['requests', 'folders'])
            ->with(['requests' => function ($query) {
                $query->whereNull('folder_id')
                    ->with(['headers', 'params']);
            }, 'folders' => function ($query) {
                $query->with(['requests' => function ($subquery) {
                    $subquery->with(['headers', 'params']);
                }]);
            }])
            ->get()
            ->map(function ($collection) {
                $collection->root_requests = $collection->requests;

                return $collection;
            });

        return Inertia::render('ApiTester', [
            'collections' => $collections,
            'environments' => $user->environments,
            'user' => $user,
        ]);
    }
}
