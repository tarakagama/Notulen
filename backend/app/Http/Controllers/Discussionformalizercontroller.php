<?php

namespace App\Http\Controllers;

use App\Services\GeminiDiscussionFormalizer;
use Illuminate\Http\Request;

class DiscussionFormalizationController extends Controller
{
    public function __construct(
        private readonly GeminiDiscussionFormalizer $formalizer
    ) {}

    /**
     * Fitur tambahan (bukan bagian FR-6.1-6.4 asli): formalisasi bahasa
     * poin Pembahasan. TIDAK terikat ke Meeting tertentu — bisa dipanggil
     * bahkan sebelum notulen pernah disimpan, karena cuma butuh teksnya
     * saja (beda dari extract-action-items yang butuh konteks attendees).
     */
    public function formalize(Request $request)
    {
        $data = $request->validate([
            'notes' => ['required', 'array', 'min:1'],
            'notes.*.temp_id' => ['required', 'string'],
            'notes.*.content' => ['required', 'string'],
        ]);

        $result = $this->formalizer->formalize($data['notes']);

        return response()->json($result);
    }
}