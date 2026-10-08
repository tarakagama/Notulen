<?php

use App\Http\Controllers\ActionItemController;
use App\Http\Controllers\ActionItemExtractionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiscussionFormalizationController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MeetingExportController;
use App\Http\Controllers\MeetingAttachmentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AttendeeController;
use Illuminate\Support\Facades\Route;

// ── Auth (publik, tanpa login) ────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// Semua route di bawah wajib login (NFR: "Setiap aksi memerlukan login").
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'updatePassword']);

    // ── User (dropdown + User Management admin) ────────────────────────
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // ── Daftar Notulensi (FR-5.x) ──────────────────────────────────────
    // PENTING: route statis (pending-approvals) HARUS didaftarkan SEBELUM
    // route dinamis ({meeting}), kalau nggak Laravel salah tangkep sebagai id.
    Route::get('/meetings', [MeetingController::class, 'index']);
    Route::get('/meetings/pending-approvals', [MeetingController::class, 'pendingApprovals']);
    Route::get('/meetings/{meeting}', [MeetingController::class, 'show']);

    // ── Meeting & MoM Editor (FR-1.x) ──────────────────────────────────
    Route::post('/meetings', [MeetingController::class, 'store']);
    Route::put('/meetings/{meeting}', [MeetingController::class, 'update']);
    Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy']);
    Route::post('/meetings/{meeting}/submit', [MeetingController::class, 'submit']);

    // ── Alur Unlock Notulen (FR-APP-03, FR-APP-04) ─────────────────────
    Route::post('/meetings/{meeting}/request-unlock', [MeetingController::class, 'requestUnlock']);
    Route::post('/meetings/{meeting}/approve-unlock', [MeetingController::class, 'approveUnlock']);
    Route::post('/meetings/{meeting}/force-unlock', [MeetingController::class, 'forceUnlock']);

    // ── Master Divisi (FR-ORG-01) ──────────────────────────────────────
    Route::get('/divisions', [DivisionController::class, 'index']);
    Route::post('/divisions', [DivisionController::class, 'store']);
    Route::put('/divisions/{division}', [DivisionController::class, 'update']);
    Route::delete('/divisions/{division}', [DivisionController::class, 'destroy']);

    // ── Room & Booking -----────────────────────────────────────────────
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/availability', [RoomController::class, 'availability']);
    Route::get('/room-bookings', [RoomController::class, 'bookings']);
    Route::post('/room-bookings', [RoomController::class, 'store']);
    Route::post('/room-bookings/{roomBooking}/approve', [RoomController::class, 'approve']);
    Route::post('/room-bookings/{roomBooking}/reject', [RoomController::class, 'reject']);
    Route::delete('/room-bookings/{roomBooking}', [RoomController::class, 'destroy']);

    // ── Approval Engine & Export (FR-2.x) ──────────────────────────────
    Route::post('/meetings/{meeting}/approve', [MeetingController::class, 'approve']);
    Route::post('/meetings/{meeting}/reject', [MeetingController::class, 'reject']);
    Route::get('/meetings/{meeting}/export', [MeetingExportController::class, 'export']);

    // ── Lampiran (foto/scan daftar hadir) ──────────────────────────────
    Route::post('/meetings/{meeting}/attachments', [MeetingAttachmentController::class, 'store']);
    Route::delete('/meetings/{meeting}/attachments/{attachment}', [MeetingAttachmentController::class, 'destroy']);

    // ── AI: auto-extract action item & formalisasi Pembahasan (FR-6.x) ─
    Route::post('/meetings/{meeting}/extract-action-items', [ActionItemExtractionController::class, 'extract']);
    Route::post('/meetings/{meeting}/accept-suggestion', [ActionItemExtractionController::class, 'accept']);
    Route::post('/discussion-notes/formalize', [DiscussionFormalizationController::class, 'formalize']);

    // ── Action Items / "Tugas Saya" (FR-3.4, FR-3.5) ───────────────────
    Route::get('/action-items', [ActionItemController::class, 'index']);
    Route::get('/my-tasks', [ActionItemController::class, 'myTasks']);
    Route::patch('/action-items/{actionItem}/status', [ActionItemController::class, 'updateStatus']);
    Route::delete('/action-items/{actionItem}', [ActionItemController::class, 'destroy']);

    // ── Executive Dashboard (FR-3.1-3.3) ───────────────────────────────
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/top-overdue', [DashboardController::class, 'topOverdue']);

    // ── Attendees (FR-1.3) ─────────────────────────────────────────────
    Route::post('/meetings/{meeting}/attendees', [AttendeeController::class, 'store']);
    Route::delete('/meetings/{meeting}/attendees/{attendee}', [AttendeeController::class, 'destroy']);
});