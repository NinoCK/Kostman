<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Collection;

class CollectionsController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $user = $request->user();
        
        $collections = $user->collections()
            ->withCount('requests')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'name' => $collection->name,
                    'description' => $collection->description,
                    'is_public' => $collection->is_public,
                    'request_count' => $collection->requests_count,
                    'created_at' => $collection->created_at->toISOString(),
                    'updated_at' => $collection->updated_at->toISOString(),
                ];
            });

        return Inertia::render('Collections', [
            'user' => $user,
            'collections' => $collections,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
        ]);

        $collection = Collection::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
            'is_public' => $request->boolean('is_public', false),
        ]);

        return redirect()->back()->with('success', 'Collection created successfully!');
    }

    public function destroy(Request $request, $id)
    {
        $collection = $request->user()->collections()->findOrFail($id);
        $collection->delete();

        return redirect()->back()->with('success', 'Collection deleted successfully!');
    }

    public function show(Request $request, $id): Response
    {
        $user = $request->user();
        $collection = $user->collections()->with('requests')->findOrFail($id);

        return Inertia::render('CollectionDetail', [
            'user' => $user,
            'collection' => $collection,
        ]);
    }
}
