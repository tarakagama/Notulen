<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Izin khusus pengelola ruangan (PIC GA). Terpisah dari global_role
        // supaya PIC ruangan tidak otomatis punya akses ke data notulen.
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_manage_rooms')->default(false)->after('global_role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_manage_rooms');
        });
    }
};