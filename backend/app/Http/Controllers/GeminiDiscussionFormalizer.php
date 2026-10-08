<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GeminiDiscussionFormalizer
{
    /**
     * Fitur tambahan (di luar FR-6.1-6.4 asli, semacam "FR-6.5"): bantu
     * Notulis mengubah poin Pembahasan yang ditulis santai/singkat jadi
     * kalimat formal ala notulen resmi, TANPA mengubah maksudnya.
     *
     * Sama seperti extraction action item: TIDAK PERNAH throw exception,
     * selalu balikin array supaya gagal API tidak menghalangi alur utama.
     *
     * @param array<array{temp_id: string, content: string}> $notes
     * @return array{success: bool, results: array, error: ?string}
     */
    public function formalize(array $notes): array
    {
        $notes = array_values(array_filter($notes, fn ($n) => trim(strip_tags($n['content'] ?? '')) !== ''));

        if (empty($notes)) {
            return ['success' => true, 'results' => [], 'error' => null];
        }

        try {
            $response = Http::timeout(config('gemini.timeout'))
                ->post(
                    config('gemini.base_url') . '/' . config('gemini.model') . ':generateContent'
                        . '?key=' . config('gemini.api_key'),
                    $this->buildPayload($notes)
                );

            if (! $response->successful()) {
                Log::warning('Gemini formalize API gagal', ['status' => $response->status(), 'body' => $response->body()]);

                return ['success' => false, 'results' => [], 'error' => 'API AI tidak merespons dengan baik.'];
            }

            $rawText = data_get($response->json(), 'candidates.0.content.parts.0.text');

            if (! $rawText) {
                return ['success' => false, 'results' => [], 'error' => 'Response API AI kosong.'];
            }

            $parsed = json_decode($rawText, true);

            if (json_last_error() !== JSON_ERROR_NONE || ! isset($parsed['points'])) {
                Log::warning('Gemini formalize response tidak bisa di-parse', ['raw' => $rawText]);

                return ['success' => false, 'results' => [], 'error' => 'Format response API AI tidak sesuai.'];
            }

            return ['success' => true, 'results' => $this->mapResultsBackToTempIds($notes, $parsed['points']), 'error' => null];
        } catch (Throwable $e) {
            Log::error('Gemini formalize exception', ['message' => $e->getMessage()]);

            return ['success' => false, 'results' => [], 'error' => 'Gagal menghubungi API AI, silakan coba lagi atau tulis manual.'];
        }
    }

    private function buildPayload(array $notes): array
    {
        $numberedList = collect($notes)
            ->map(fn ($n, $i) => ($i + 1) . '. ' . strip_tags($n['content']))
            ->implode("\n");

        $prompt = <<<PROMPT
            Kamu membantu Notulis menulis notulen rapat internal perusahaan berbahasa Indonesia yang formal.
            Berikut poin-poin Pembahasan yang ditulis santai/singkat oleh Notulis, secara berurutan:

            {$numberedList}

            Tugasmu: tulis ulang SETIAP poin menjadi kalimat formal ala notulen resmi perusahaan
            (gaya bahasa baku, lengkap secara tata bahasa), TANPA mengubah makna, fakta, atau menambah
            informasi yang tidak disebutkan. Jangan gabungkan beberapa poin jadi satu, jumlah hasil harus
            SAMA PERSIS dengan jumlah poin input, urutan harus sama.

            Contoh gaya yang diinginkan:
            Input: "TIG mau kirim amandemen ke umum"
            Output: "Bidang TIG akan menyampaikan permohonan amandemen kepada Bidang Umum."
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
                        'points' => [
                            'type' => 'ARRAY',
                            'items' => ['type' => 'STRING'],
                        ],
                    ],
                    'required' => ['points'],
                ],
            ],
        ];
    }

    /**
     * Cocokkan balik hasil (array string, urut) ke temp_id asalnya.
     * Kalau AI ternyata balikin jumlah yang beda (harusnya jarang terjadi
     * karena sudah diminta eksplisit), pasangkan sebanyak yang bisa saja
     * dan biarkan sisanya tanpa usulan (Notulis tetap bisa isi manual).
     */
    private function mapResultsBackToTempIds(array $notes, array $formalizedPoints): array
    {
        $results = [];

        foreach ($notes as $i => $note) {
            if (! isset($formalizedPoints[$i])) {
                continue;
            }

            $results[] = [
                'temp_id' => $note['temp_id'],
                'original_content' => $note['content'],
                'formalized_content' => $formalizedPoints[$i],
            ];
        }

        return $results;
    }
}