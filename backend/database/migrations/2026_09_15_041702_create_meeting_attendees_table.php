<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('external_name', 150)->nullable();
            $table->string('external_org', 150)->nullable();
            $table->string('role_in_meeting', 100)->nullable();
            $table->boolean('is_signed')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_attendees');
    }
};