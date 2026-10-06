<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms');
            $table->foreignId('user_id')->constrained('users'); // host
            $table->string('title', 255);
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->enum('status', ['Pending', 'Approved', 'Cancelled', 'Rejected'])->default('Approved');
            $table->text('purpose')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_bookings');
    }
};