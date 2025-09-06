<?php

use App\Http\Controllers\CollectionsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnvironmentsController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Development routes (remove in production)
Route::get('/dev-login', function () {
    $user = \App\Models\User::first();
    if ($user) {
        Auth::login($user);

        return redirect('/dashboard');
    }

    return redirect('/login');
});

Route::get('/csrf-test', function () {
    return response()->json([
        'csrf_token' => csrf_token(),
        'session_id' => session()->getId(),
        'session_started' => session()->isStarted() ? 'yes' : 'no',
        'meta_tag' => '<meta name="csrf-token" content="'.csrf_token().'">',
    ]);
});

Route::post('/csrf-test', function () {
    return response()->json([
        'message' => 'CSRF test successful!',
        'csrf_token' => csrf_token(),
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/api-tester', [DashboardController::class, 'apiTester'])->name('api-tester');

    Route::get('/collections', [CollectionsController::class, 'index'])->name('collections.index');
    Route::post('/collections', [CollectionsController::class, 'store'])->name('collections.store');
    Route::get('/collections/{id}', [CollectionsController::class, 'show'])->name('collections.show');
    Route::delete('/collections/{id}', [CollectionsController::class, 'destroy'])->name('collections.destroy');

    Route::get('/environments', [EnvironmentsController::class, 'index'])->name('environments.index');
});

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
require __DIR__.'/test.php';
