<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestParam extends Model
{
    protected $fillable = [
        'request_id',
        'key',
        'value',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }
}
