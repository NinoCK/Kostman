<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnvironmentVariable extends Model
{
    protected $fillable = [
        'environment_id',
        'key',
        'initial_value',
        'current_value',
        'is_secret',
    ];

    protected $casts = [
        'is_secret' => 'boolean',
    ];

    public function environment(): BelongsTo
    {
        return $this->belongsTo(Environment::class);
    }
}
