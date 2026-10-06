<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1.11 Catatan Migrasi: seluruh notulen v1 yang sudah ada diberi
        // division_id sesuai Divisi IT & Digitalization (bukan otomatis Public).
        $itDivisionId = DB::table('divisions')->insertGetId([
            'division_name' => 'IT & Digitalization',
            'code' => 'IT',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('meetings', function (Blueprint $table) use ($itDivisionId) {
            // Nullable di level DB (non-destruktif buat data lama), tapi WAJIB
            // diisi lewat validasi aplikasi (StoreMeetingRequest) untuk notulen baru.
            $table->foreignId('division_id')->nullable()->after('id')->constrained('divisions');

            // room_booking_id TANPA foreign key dulu — tabel room_bookings belum
            // ada di fase ini (dibikin di fase Modul Ruangan & Booking berikutnya).
            // FK constraint-nya ditambahkan nanti lewat migration terpisah begitu
            // tabel room_bookings sudah ada.
            $table->unsignedBigInteger('room_booking_id')->nullable()->after('division_id');

            $table->enum('visibility', ['Public', 'Division', 'Restricted'])
                ->default('Division')
                ->after('discussion_manual_content');

            $table->enum('unlock_request_status', ['None', 'Requested', 'Approved', 'Rejected'])
                ->default('None')
                ->after('revision_note');
            $table->text('unlock_reason')->nullable()->after('unlock_request_status');

            // Dukungan arsip legacy (FR-EXP-02) — notulen lama yang diimpor
            // bukan dari alur native aplikasi.
            $table->enum('source', ['native', 'legacy'])->default('native')->after('unlock_reason');
            $table->string('legacy_file_path')->nullable()->after('source');
            $table->longText('legacy_text')->nullable()->after('legacy_file_path');
        });

        // Backfill data lama sesuai catatan migrasi 1.11.
        DB::table('meetings')->update(['division_id' => $itDivisionId]);
    }

    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropColumn([
                'division_id', 'room_booking_id', 'visibility',
                'unlock_request_status', 'unlock_reason',
                'source', 'legacy_file_path', 'legacy_text',
            ]);
        });
    }
};