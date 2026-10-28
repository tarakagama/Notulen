<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActionItemLog extends Model
{
    public $timestamps = false; // hanya created_at, diisi database

    protected $fillable = [
        'action_item_id', 'user_id', 'action', 'from_status', 'to_status',
        'deadline', 'days_diff', 'note',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'deadline' => 'date',
            'days_diff' => 'integer',
        ];
    }

    public function actionItem()
    {
        return $this->belongsTo(ActionItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}