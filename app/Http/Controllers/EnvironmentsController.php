<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class EnvironmentsController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $user = $request->user();
        
        $environments = $user->environments()
            ->with('variables')
            ->orderBy('is_active', 'desc')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($environment) {
                return [
                    'id' => $environment->id,
                    'name' => $environment->name,
                    'is_active' => $environment->is_active,
                    'variable_count' => $environment->variables->count(),
                    'created_at' => $environment->created_at->toISOString(),
                    'updated_at' => $environment->updated_at->toISOString(),
                    'variables' => $environment->variables->map(function ($variable) {
                        return [
                            'id' => $variable->id,
                            'key' => $variable->key,
                            'initial_value' => $variable->initial_value,
                            'current_value' => $variable->current_value,
                            'is_secret' => $variable->is_secret,
                        ];
                    }),
                ];
            });

        return Inertia::render('Environments', [
            'user' => $user,
            'environments' => $environments,
        ]);
    }
}
