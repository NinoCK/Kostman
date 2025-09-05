<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Environment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class EnvironmentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Environment::class);
        
        $environments = $request->user()
            ->environments()
            ->with('variables')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['environments' => $environments]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Environment::class);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $environment = $request->user()->environments()->create([
            'name' => $validated['name'],
            'is_active' => false,
        ]);

        return response()->json([
            'environment' => $environment->load('variables'),
        ], 201);
    }

    public function show(Request $request, Environment $environment): JsonResponse
    {
        $this->authorize('view', $environment);
        
        return response()->json([
            'environment' => $environment->load('variables'),
        ]);
    }

    public function update(Request $request, Environment $environment): JsonResponse
    {
        $this->authorize('update', $environment);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        $environment->update($validated);

        return response()->json([
            'environment' => $environment->fresh('variables'),
        ]);
    }

    public function destroy(Environment $environment): JsonResponse
    {
        $this->authorize('delete', $environment);
        
        $environment->delete();
        return response()->json(['message' => 'Environment deleted successfully']);
    }

    public function activate(Request $request, Environment $environment): JsonResponse
    {
        $this->authorize('activate', $environment);
        
        // Deactivate all user environments first
        $request->user()->environments()->update(['is_active' => false]);
        
        // Activate the selected environment
        $environment->update(['is_active' => true]);

        return response()->json([
            'environment' => $environment->fresh('variables'),
            'message' => 'Environment activated successfully',
        ]);
    }
}
