<?php

return [
    'api_key' => env('GEMINI_API_KEY'),

    // Model gratis (free tier), lihat project brief bagian 7.
    // Update Sep 2026: gemini-2.0-flash-lite sudah deprecated,
    // Google merekomendasikan gemini-3.5-flash-lite sebagai penggantinya.
    'model' => env('GEMINI_MODEL', 'gemini-3.5-flash-lite'),

    'base_url' => 'https://generativelanguage.googleapis.com/v1beta/models',

    // Timeout dalam detik. FR-6.4: kegagalan API tidak boleh
    // menghalangi alur utama, jadi timeout harus pendek.
    'timeout' => env('GEMINI_TIMEOUT', 15),
];