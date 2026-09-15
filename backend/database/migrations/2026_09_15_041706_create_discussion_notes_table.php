<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discussion_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('parent_note_id')->nullable()->constrained('discussion_notes')->cascadeOnDelete();
            $table->integer('order_in_level');
            $table->text('content');
            $table->string('speaker_group', 150)->nullable();
            $table->enum('category', ['Bug/Error', 'SOP', 'New Requirement'])->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discussion_notes');
    }
};