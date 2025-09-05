<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Request extends Model
{
    protected $fillable = [
        'collection_id',
        'folder_id',
        'name',
        'method',
        'url',
        'description',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function headers(): HasMany
    {
        return $this->hasMany(RequestHeader::class);
    }

    public function params(): HasMany
    {
        return $this->hasMany(RequestParam::class);
    }

    public function body(): HasOne
    {
        return $this->hasOne(RequestBody::class);
    }

    public function activeHeaders(): HasMany
    {
        return $this->hasMany(RequestHeader::class)->where('is_active', true);
    }

    public function activeParams(): HasMany
    {
        return $this->hasMany(RequestParam::class)->where('is_active', true);
    }
}
