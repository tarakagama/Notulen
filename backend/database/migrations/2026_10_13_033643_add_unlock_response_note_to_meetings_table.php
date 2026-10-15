<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Alasan penolakan permohonan unlock dari approver, ditampilkan ke notulis.
        Schema::table('meetings', function (Blueprint $table) {
            $table->text('unlock_response_note')->nullable()->after('unlock_reason');
        });
    }

    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn('unlock_response_note');
        });
    }
};