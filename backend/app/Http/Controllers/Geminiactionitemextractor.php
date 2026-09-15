<?php

namespace App\Services;

use App\Models\Meeting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GeminiActionItemExtractor
{
    /**
     * FR-6.1: kirim isi Pembahasan ke Gemini, minta usulan action item
     * terstruktur (deskripsi, tebakan PIC, tebakan prioritas).
     *
     * FR-6.4: kegagalan API (timeout, error, response tidak valid) TIDAK
     * boleh melempar exception ke caller — selalu balikin array, kosong
     * kalau gagal, supaya alur utama pembuatan notulen tetap jalan.
     *
     * @return array{success: bool, suggestions: array, error: ?string}
     */
    public function extract(Meeting $meeting): array
    {
        $discussionText = $this->flattenDiscussionNotes($meeting);

        if (trim($discussionText) === '') {
            return ['success' => true, 'suggestions' => [], 'error' => null];
        }

        $candidateUsers = $this->candidateUsersForPic($meeting);

        try {
            $response = Http::timeout(config('gemini.timeout'))
                ->post(
                    config('gemini.base_url') . '/' . config('gemini.model') . ':generateContent'
                        . '?key=' . config('gemini.api_key'),
                    $this->buildPayload($discussionText, $candidateUsers)
                );

            if (! $response->successful()) {
                Log::warning('Gemini API gagal', ['status' => $response->status(), 'body' => $response->body()]);

                return ['success' => false, 'suggestions' => [], 'error' => 'API AI tidak merespons dengan baik.'];
            }

            $rawText = data_get($response->json(), 'candidates.0.content.parts.0.text');

            if (! $rawText) {
                return ['success' => false, 'suggestions' => [], 'error' => 'Response API AI kosong.'];
            }

            $parsed = json_decode($rawText, true);

            if (json_last_error() !== JSON_ERROR_NONE || ! isset($parsed['action_items'])) {
                Log::warning('Gemini response tidak bisa di-parse jadi JSON', ['raw' => $rawText]);

                return ['success' => false, 'suggestions' => [], 'error' => 'Format response API AI tidak sesuai.'];
            }

            return [
                'success' => true,
                'suggestions' => $this->normalizeSuggestions($parsed['action_items'], $candidateUsers),
                'error' => null,
            ];
        } catch (Throwable $e) {
            // FR-6.4: timeout / connection error / apapun -> jangan sampai
            // melempar exception, cukup log dan balikin gagal dengan sopan.
            Log::error('Gemini API exception', ['message' => $e->getMessage()]);

            return ['success' => false, 'suggestions' => [], 'error' => 'Gagal menghubungi API AI, silakan coba lagi atau isi manual.'];
        }
    }

    /**
     * Gabungkan seluruh Pembahasan (flat, urut) jadi satu teks buat prompt.
     * Kategori disertakan biar AI punya konteks tambahan.
     */
    private function flattenDiscussionNotes(Meeting $meeting): string
    {
        // FR baru: Pembahasan bisa ditulis manual (rich-text bebas), bukan
        // cuma outline nested — AI extract harus tetap bisa baca dua-duanya.
        if ($meeting->discussion_mode === 'manual') {
            return strip_tags($meeting->discussion_manual_content ?? '');
        }

        return $meeting->allDiscussionNotes()
            ->orderBy('parent_note_id')
            ->orderBy('order_in_level')
            ->get()
            ->map(function ($note) {
                $category = $note->category ? " [{$note->category}]" : '';

                return "- " . strip_tags($note->content) . $category;
            })
            ->implode("\n");
    }

    /**
     * Daftar user yang bisa jadi kandidat PIC (dari daftar hadir rapat ini),
     * dikasih ke AI biar tebakan PIC lebih akurat (cocokkan nama yang
     * disebut di Pembahasan dengan nama user internal).
     */
    private function candidateUsersForPic(Meeting $meeting): array
    {
        return $meeting->attendees()
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter()
            ->map(fn ($user) => ['id' => $user->id, 'name' => $user->full_name])
            ->values()
            ->all();
    }

    private function buildPayload(string $discussionText, array $candidateUsers): array
    {
        $userList = collect($candidateUsers)
            ->map(fn ($u) => "id={$u['id']}: {$u['name']}")
            ->implode("\n");

        $prompt = <<<PROMPT
            Kamu membantu menganalisis notulen rapat internal perusahaan berbahasa Indonesia.
            Berikut adalah isi bagian Pembahasan dari sebuah rapat:

            {$discussionText}

            Daftar peserta rapat yang bisa dijadikan PIC (Penanggung Jawab), beserta id-nya:
            {$userList}

            Tugasmu: identifikasi komitmen atau tindak lanjut (action item) yang tersirat maupun tersurat
            di dalam Pembahasan di atas. Untuk setiap action item, tentukan:
            - description: deskripsi singkat & jelas tindak lanjutnya (dalam Bahasa Indonesia)
            - guessed_pic_id: id user dari daftar di atas yang paling mungkin bertanggung jawab (jika disebutkan
              namanya atau divisinya di teks), atau null kalau tidak ada yang cocok
            - guessed_pic_name_raw: nama/divisi yang disebutkan di teks asli (jika ada), untuk membantu Notulis
              verifikasi kalau guessed_pic_id ternyata salah/kosong
            - guessed_priority: "Low", "Medium", atau "High" berdasarkan urgensi yang tersirat di teks

            Kalau tidak ada action item yang bisa diidentifikasi, kembalikan array kosong.

            PENTING soal gaya deskripsi:
            - JANGAN menyalin ulang kalimat Pembahasan secara panjang lebar atau kata-per-kata.
            - Tulis description SINGKAT dan actionable, cukup 1 kalimat pendek yang menyebutkan
              APA yang perlu dilakukan, tanpa detail konteks/alasan yang sudah ada di Pembahasan.
            - Contoh BENAR: "Kirim permohonan amandemen ke Bidang Umum"
            - Contoh SALAH (terlalu panjang, menyalin ulang): "Bidang TIG akan segera menyampaikan
              permohonan amandemen kepada Bidang Umum berdasarkan hasil kesepakatan pelaksanaan amandemen"
            - Kalau satu poin Pembahasan sudah singkat, cukup rangkum jadi frasa tugas (bukan kalimat penuh).
            PROMPT;

        return [
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'action_items' => [
                            'type' => 'ARRAY',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'description' => ['type' => 'STRING'],
                                    'guessed_pic_id' => ['type' => 'INTEGER', 'nullable' => true],
                                    'guessed_pic_name_raw' => ['type' => 'STRING', 'nullable' => true],
                                    'guessed_priority' => [
                                        'type' => 'STRING',
                                        'enum' => ['Low', 'Medium', 'High'],
                                    ],
                                ],
                                'required' => ['description', 'guessed_priority'],
                            ],
                        ],
                    ],
                    'required' => ['action_items'],
                ],
            ],
        ];
    }

    /**
     * FR-6.2: hasil ini HARUS ditampilkan sebagai draft untuk direview,
     * bukan langsung masuk Action_Items. Validasi guessed_pic_id benar-benar
     * ada di daftar kandidat, biar nggak nunjuk user yang salah/nggak ada.
     */
    private function normalizeSuggestions(array $items, array $candidateUsers): array
    {
        $validIds = collect($candidateUsers)->pluck('id')->all();

        return collect($items)->map(function ($item) use ($validIds) {
            $picId = $item['guessed_pic_id'] ?? null;

            return [
                'description' => $item['description'] ?? '',
                'guessed_pic_id' => in_array($picId, $validIds, true) ? $picId : null,
                'guessed_pic_name_raw' => $item['guessed_pic_name_raw'] ?? null,
                'guessed_priority' => in_array($item['guessed_priority'] ?? null, ['Low', 'Medium', 'High'], true)
                    ? $item['guessed_priority']
                    : 'Medium',
            ];
        })->values()->all();
    }
}