<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Daftar notifikasi milik user login (terbaru dulu), plus jumlah yang belum dibaca.
     * ?unread=1 untuk hanya yang belum dibaca.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = $request->boolean('unread') ? $user->unreadNotifications() : $user->notifications();
        $paginator = $query->paginate((int) $request->query('per_page', 15));

        return response()->json([
            ...$paginator->toArray(),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        $user = $request->user();

        // Hanya notifikasi milik sendiri; milik orang lain jatuh ke 404.
        $user->notifications()->findOrFail($id)->markAsRead();

        return response()->json(['unread_count' => $user->unreadNotifications()->count()]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['unread_count' => 0]);
    }
}