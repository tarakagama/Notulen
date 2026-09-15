<?php

namespace App\Console\Commands;

use App\Models\ActionItem;
use Illuminate\Console\Command;

class MarkOverdueActionItems extends Command
{
    protected $signature = 'action-items:mark-overdue';

    protected $description = 'FR-3.2: Update status action item terlambat jadi Overdue secara otomatis (dijalankan harian)';

    public function handle(): int
    {
        $count = ActionItem::query()
            ->whereNotIn('status', ['Completed', 'Overdue'])
            ->whereDate('deadline', '<', now()->toDateString())
            ->update(['status' => 'Overdue']);

        $this->info("{$count} action item ditandai Overdue.");

        return self::SUCCESS;
    }
}