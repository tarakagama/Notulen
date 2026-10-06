<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kedua kolom ini sudah dibuat di add_enterprise_fields_to_meetings_table.
        // Dijaga supaya aman dijalankan di database yang sudah punya kolomnya.
        Schema::table('meetings', function (Blueprint $table) {
            if (! Schema::hasColumn('meetings', 'unlock_request_status')) {
                $table->enum('unlock_request_status', ['None', 'Requested', 'Approved', 'Rejected'])
                    ->default('None')->after('revision_note');
            }

            if (! Schema::hasColumn('meetings', 'unlock_reason')) {
                $table->text('unlock_reason')->nullable()->after('unlock_request_status');
            }
        });
    }

    public function down(): void
    {

    }
};