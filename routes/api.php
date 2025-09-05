<?php

use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\EnvironmentController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\RequestExecutorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth');

// Public routes for testing
Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working!',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// Protected API routes using session authentication (for Inertia SPA)
Route::middleware(['auth'])->group(function () {
    
    // Collections
    Route::apiResource('collections', CollectionController::class);
    Route::post('collections/{collection}/share', [CollectionController::class, 'share']);
    Route::delete('collections/{collection}/unshare', [CollectionController::class, 'unshare']);
    
    // Requests
    Route::apiResource('requests', RequestController::class);
    Route::post('requests/{request}/duplicate', [RequestController::class, 'duplicate']);
    
    // Request Execution
    Route::post('requests/execute', [RequestExecutorController::class, 'execute']);
    Route::post('requests/{request}/execute', [RequestExecutorController::class, 'executeRequest']);
    
    // Environments
    Route::apiResource('environments', EnvironmentController::class);
    Route::post('environments/{environment}/activate', [EnvironmentController::class, 'activate']);
    
    // History
    Route::apiResource('history', HistoryController::class)->only(['index', 'show', 'destroy']);
    Route::delete('history', [HistoryController::class, 'clear']);
    
});

// Public shared collection routes
Route::get('shared/{token}', [CollectionController::class, 'showShared']);
