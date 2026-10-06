<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('division_id')->nullable()->after('id')->constrained('divisions');

            // Role GLOBAL (melekat pada akun) — menggantikan is_admin boolean lama
            // yang cuma 2 level, sekarang 4 level sesuai PRD v2 bagian 1.4.
            $table->enum('global_role', ['SuperAdmin', 'AdminDivisi', 'User', 'Viewer'])
                ->default('User')
                ->after('division_id');
        });

        // Migrasi data lama: is_admin = true -> SuperAdmin, selain itu -> User (default).
        // Dijalankan SEBELUM kolom is_admin dihapus, supaya datanya nggak hilang percuma.
        DB::table('users')->where('is_admin', true)->update(['global_role' => 'SuperAdmin']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false);
        });

        DB::table('users')->where('global_role', 'SuperAdmin')->update(['is_admin' => true]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropColumn(['division_id', 'global_role']);
        });
    }
};