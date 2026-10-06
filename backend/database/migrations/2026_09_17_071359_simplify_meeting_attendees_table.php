<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $renames = [
        'external_name' => 'name',
        'external_org' => 'division',
        'is_signed' => 'is_present',
    ];

    public function up(): void
    {
        foreach ($this->renames as $from => $to) {
            if (Schema::hasColumn('meeting_attendees', $from) && ! Schema::hasColumn('meeting_attendees', $to)) {
                Schema::table('meeting_attendees', function (Blueprint $table) use ($from, $to) {
                    $table->renameColumn($from, $to);
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->renames as $from => $to) {
            if (Schema::hasColumn('meeting_attendees', $to) && ! Schema::hasColumn('meeting_attendees', $from)) {
                Schema::table('meeting_attendees', function (Blueprint $table) use ($from, $to) {
                    $table->renameColumn($to, $from);
                });
            }
        }
    }
};