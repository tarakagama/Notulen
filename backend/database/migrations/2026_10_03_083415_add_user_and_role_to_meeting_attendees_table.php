<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // user_id: peserta internal (nullable untuk tamu eksternal).
        // role_in_meeting: Host / Participant / Speaker.
        Schema::table('meeting_attendees', function (Blueprint $table) {
            if (! Schema::hasColumn('meeting_attendees', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('meeting_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('meeting_attendees', 'role_in_meeting')) {
                $table->string('role_in_meeting', 100)
                    ->default('Participant')
                    ->after('division');
            }
        });
    }

    public function down(): void
    {
        Schema::table('meeting_attendees', function (Blueprint $table) {
            if (Schema::hasColumn('meeting_attendees', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }

            if (Schema::hasColumn('meeting_attendees', 'role_in_meeting')) {
                $table->dropColumn('role_in_meeting');
            }
        });
    }
};