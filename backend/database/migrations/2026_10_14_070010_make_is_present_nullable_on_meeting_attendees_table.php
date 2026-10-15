<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // is_present sekarang tiga keadaan: null = belum dikonfirmasi, true = hadir, false = tidak hadir.
        Schema::table('meeting_attendees', function (Blueprint $table) {
            $table->boolean('is_present')->nullable()->default(null)->change();
        });

        // Peserta internal yang masuk lewat booking dulu otomatis diberi false, padahal belum dikonfirmasi.
        // (Sebelum ini tidak ada cara menandai peserta internal sebagai Tidak Hadir, jadi false = otomatis.)
        DB::table('meeting_attendees')->whereNotNull('user_id')->where('is_present', false)->update(['is_present' => null]);
    }

    public function down(): void
    {
        DB::table('meeting_attendees')->whereNull('is_present')->update(['is_present' => false]);

        Schema::table('meeting_attendees', function (Blueprint $table) {
            $table->boolean('is_present')->nullable(false)->default(false)->change();
        });
    }
};