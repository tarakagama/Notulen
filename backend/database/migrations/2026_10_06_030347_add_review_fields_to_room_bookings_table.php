<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->foreignId('meeting_approver_id')
                ->nullable()
                ->after('purpose')
                ->constrained('users')
                ->nullOnDelete();
            $table->json('invitee_ids')->nullable()->after('meeting_approver_id');
            $table->text('review_note')->nullable()->after('invitee_ids');
        });
    }

    public function down(): void
    {
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('meeting_approver_id');
            $table->dropColumn(['invitee_ids', 'review_note']);
        });
    }
};