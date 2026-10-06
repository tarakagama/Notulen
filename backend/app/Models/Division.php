<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    protected $fillable = ['division_name', 'code'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }
}