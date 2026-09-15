<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('meeting_title', 255);
            $table->string('meeting_type', 100)->nullable();
            $table->date('meeting_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location', 255)->nullable();
            $table->text('agenda');
            $table->text('background')->nullable();
            $table->text('conclusion')->nullable();

            // Cara menulis Pembahasan: outline terstruktur (default) atau
            // manual bebas ala rich-text editor.
            $table->enum('discussion_mode', ['outline', 'manual'])->default('outline');
            $table->longText('discussion_manual_content')->nullable();

            $table->enum('status', ['Draft', 'Waiting Approval', 'Approved', 'Rejected'])->default('Draft');
            $table->foreignId('notulis_id')->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();

            // Catatan revisi dari approver saat menolak notulen.
            $table->text('revision_note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};