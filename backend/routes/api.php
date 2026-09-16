<?php

use App\Http\Controllers\ActionItemController;
use App\Http\Controllers\ActionItemExtractionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiscussionFormalizationController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MeetingExportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Route;

Schedule::command('action-items:mark-overdue')->dailyAt('00:05');

// ── Auth (publik, tanpa login) ────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// Semua route di bawah wajib login (NFR: "Setiap aksi memerlukan login").
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── User (buat dropdown PIC/attendee/approver) ────────────────────
    Route::get('/users', [UserController::class, 'index']);

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

    // ── Approval Engine & Export (FR-2.x) ──────────────────────────────
    Route::post('/meetings/{meeting}/approve', [MeetingController::class, 'approve']);
    Route::post('/meetings/{meeting}/reject', [MeetingController::class, 'reject']);
    Route::get('/meetings/{meeting}/export', [MeetingExportController::class, 'export']);

    // ── AI: auto-extract action item & formalisasi Pembahasan (FR-6.x) ─
    Route::post('/meetings/{meeting}/extract-action-items', [ActionItemExtractionController::class, 'extract']);
    Route::post('/meetings/{meeting}/accept-suggestion', [ActionItemExtractionController::class, 'accept']);
    Route::post('/discussion-notes/formalize', [DiscussionFormalizationController::class, 'formalize']);

    // ── Action Items / "Tugas Saya" (FR-3.4, FR-3.5) ───────────────────
    Route::get('/my-tasks', [ActionItemController::class, 'myTasks']);
    Route::patch('/action-items/{actionItem}/status', [ActionItemController::class, 'updateStatus']);
    Route::delete('/action-items/{actionItem}', [ActionItemController::class, 'destroy']);

    // ── Executive Dashboard (FR-3.1-3.3) ───────────────────────────────
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/top-overdue', [DashboardController::class, 'topOverdue']);
});