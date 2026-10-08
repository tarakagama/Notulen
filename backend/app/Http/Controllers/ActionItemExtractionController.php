<?php

namespace App\Http\Controllers;

use App\Models\ActionItem;
use App\Models\Meeting;
use App\Services\GeminiActionItemExtractor;

class ActionItemExtractionController extends Controller
{
    public function __construct(
        private readonly GeminiActionItemExtractor $extractor
    ) {}

    /**
     * FR-6.1, FR-6.4: minta usulan action item dari AI berdasarkan
     * Pembahasan rapat ini. Hasilnya HANYA usulan (belum tersimpan),
     * ditampilkan ke Notulis untuk direview (FR-6.2).
     *
     * Kegagalan API (timeout dkk) balik 200 dengan success=false,
     * BUKAN error 500 — supaya frontend bisa tetap kasih opsi "isi manual".
     */
    public function extract(Meeting $meeting)
    {
        $this->authorize('update', $meeting); // hanya notulis pemilik / admin

        $result = $this->extractor->extract($meeting);

        return response()->json($result);
    }

    /**
     * FR-6.2, FR-6.3: Notulis klik "Terima" pada satu usulan -> baru
     * masuk ke Action_Items dengan source = 'AI Suggested'.
     */
    public function accept(Meeting $meeting)
    {
        $this->authorize('update', $meeting);

        $data = request()->validate([
            'description' => ['required', 'string'],
            'pic_id' => ['required', 'exists:users,id'],
            'deadline' => ['required', 'date', 'after_or_equal:today'],
            'priority' => ['required', 'in:Low,Medium,High'],
        ]);

        $actionItem = ActionItem::create([
            ...$data,
            'meeting_id' => $meeting->id,
            'source' => 'AI Suggested', // FR-6.3: penanda sumber
        ]);

        return response()->json($actionItem, 201);
    }
}