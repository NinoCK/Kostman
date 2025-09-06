<?php

namespace App\Console\Commands;

use App\Models\Collection;
use App\Models\Environment;
use App\Models\Request;
use App\Models\User;
use Illuminate\Console\Command;

class CreateTestData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:create-data {user_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test collections, requests, and environments for a user';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $userId = $this->argument('user_id') ?? 1;

        $user = User::find($userId);
        if (! $user) {
            $this->error("User with ID {$userId} not found.");

            return;
        }

        $this->info("Creating test data for user: {$user->name}");

        // Create collections
        $collections = [
            [
                'name' => 'JSONPlaceholder API',
                'description' => 'Testing collection for JSONPlaceholder API',
                'is_public' => false,
            ],
            [
                'name' => 'ReqRes API',
                'description' => 'Testing collection for ReqRes API',
                'is_public' => true,
            ],
        ];

        foreach ($collections as $collectionData) {
            $collection = Collection::create([
                'user_id' => $user->id,
                ...$collectionData,
            ]);

            // Create requests for each collection
            $requests = [
                [
                    'name' => 'Get All Posts',
                    'method' => 'GET',
                    'url' => 'https://jsonplaceholder.typicode.com/posts',
                    'description' => 'Fetch all posts from JSONPlaceholder',
                    'position' => 1,
                ],
                [
                    'name' => 'Get Single Post',
                    'method' => 'GET',
                    'url' => 'https://jsonplaceholder.typicode.com/posts/1',
                    'description' => 'Fetch a single post',
                    'position' => 2,
                ],
                [
                    'name' => 'Create Post',
                    'method' => 'POST',
                    'url' => 'https://jsonplaceholder.typicode.com/posts',
                    'description' => 'Create a new post',
                    'position' => 3,
                ],
            ];

            foreach ($requests as $requestData) {
                Request::create([
                    'collection_id' => $collection->id,
                    ...$requestData,
                ]);
            }

            $this->info("Created collection: {$collection->name} with ".count($requests).' requests');
        }

        // Create environments
        $environments = [
            [
                'name' => 'Development',
                'is_active' => true,
            ],
            [
                'name' => 'Production',
                'is_active' => false,
            ],
        ];

        foreach ($environments as $environmentData) {
            $environment = Environment::create([
                'user_id' => $user->id,
                ...$environmentData,
            ]);

            $this->info("Created environment: {$environment->name}");
        }

        $this->info('Test data created successfully!');
        $this->info('You can now visit http://127.0.0.1:8000/api-tester to see the collections.');
    }
}
