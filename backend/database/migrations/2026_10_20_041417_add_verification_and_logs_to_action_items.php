<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Verifikasi penyelesaian: status 'Completed' tanpa verified_at = menunggu verifikasi.
        Schema::table('action_items', function (Blueprint $table) {
            $table->foreignId('verified_by')->nullable()->after('completed_at')->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable()->after('verified_by');
            $table->text('verification_note')->nullable()->after('verified_at');
        });

        // Jejak setiap perubahan status: siapa, kapan, dan selisih hari terhadap deadline.
        Schema::create('action_item_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('action_item_id')->constrained('action_items')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 30); // Started, Completed, Reopened, Verified, VerificationRejected
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20)->nullable();
            $table->date('deadline')->nullable();      // deadline saat aksi terjadi
            $table->integer('days_diff')->nullable();  // negatif = lebih cepat, 0 = tepat waktu, positif = terlambat
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['action_item_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('action_item_logs');

        Schema::table('action_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn(['verified_at', 'verification_note']);
        });
    }
};