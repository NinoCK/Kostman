<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RequestHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class HistoryController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RequestHistory::class);
        
        $history = $request->user()
            ->requestHistories()
            ->orderBy('created_at', 'desc')
            ->limit(50) // Limit to last 50 requests
            ->get();

        return response()->json(['history' => $history]);
    }

    public function show(Request $request, RequestHistory $history): JsonResponse
    {
        $this->authorize('view', $history);
        
        return response()->json(['history' => $history]);
    }

    public function destroy(RequestHistory $history): JsonResponse
    {
        $this->authorize('delete', $history);
        
        $history->delete();
        return response()->json(['message' => 'History item deleted successfully']);
    }

    public function clear(Request $request): JsonResponse
    {
        // User can only clear their own history
        $request->user()->requestHistories()->delete();
        return response()->json(['message' => 'History cleared successfully']);
    }
}
