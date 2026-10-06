<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kolom room_booking_id sudah dibuat di migrasi
        // add_enterprise_fields_to_meetings_table (tanpa FK, karena room_bookings
        // belum ada saat itu). Di sini cukup menambahkan FK-nya.
        if (! Schema::hasColumn('meetings', 'room_booking_id')) {
            Schema::table('meetings', function (Blueprint $table) {
                $table->unsignedBigInteger('room_booking_id')->nullable()->after('id');
            });
        }

        if (! $this->hasForeign()) {
            Schema::table('meetings', function (Blueprint $table) {
                $table->foreign('room_booking_id')
                    ->references('id')
                    ->on('room_bookings')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Hanya FK yang dilepas; kolomnya milik migrasi enterprise.
        if ($this->hasForeign()) {
            Schema::table('meetings', function (Blueprint $table) {
                $table->dropForeign(['room_booking_id']);
            });
        }
    }

    private function hasForeign(): bool
    {
        foreach (Schema::getForeignKeys('meetings') as $fk) {
            if (in_array('room_booking_id', $fk['columns'], true)) {
                return true;
            }
        }

        return false;
    }
};