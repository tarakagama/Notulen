<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role Viewer bersifat read-only (PRD 4.A): boleh melihat kalender ruangan,
 * membaca notulen Approved, dan mengekspor PDF, tapi tidak boleh mengubah data.
 *
 * Semua permintaan yang mengubah data (POST/PUT/PATCH/DELETE) ditolak, kecuali
 * pengaturan akunnya sendiri dan membaca notifikasi. Route baru yang mengubah data
 * otomatis ikut terblokir tanpa perlu diingat satu per satu.
 */
class DenyViewerWrites
{
    private const ALLOWED = [
        'api/logout',
        'api/profile',
        'api/profile/password',
        'api/notifications/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user
            && $user->global_role === 'Viewer'
            && ! $request->isMethodSafe()
            && ! $request->is(...self::ALLOWED)
        ) {
            return response()->json(['message' => 'Role Viewer hanya dapat melihat data.'], 403);
        }

        return $next($request);
    }
}