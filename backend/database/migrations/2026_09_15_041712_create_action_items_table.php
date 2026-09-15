<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('action_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->text('description');
            $table->foreignId('pic_id')->constrained('users');
            $table->date('deadline');
            $table->enum('priority', ['Low', 'Medium', 'High'])->default('Medium');
            $table->enum('status', ['Open', 'In Progress', 'Overdue', 'Completed'])->default('Open');
            $table->text('completion_note')->nullable();
            $table->enum('source', ['Manual', 'AI Suggested'])->default('Manual');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Dipakai berat oleh dashboard (filter per status & deadline).
            $table->index('status');
            $table->index('deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('action_items');
    }
};