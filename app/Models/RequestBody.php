<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestBody extends Model
{
    protected $fillable = [
        'request_id',
        'type',
        'content',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }
}
