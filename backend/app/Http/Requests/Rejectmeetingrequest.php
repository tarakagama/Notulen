<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // FR-2.3: hanya approver yang ditunjuk di meeting ini
        return $this->user()->can('reject', $this->route('meeting'));
    }

    public function rules(): array
    {
        return [
            // Catatan revisi wajib diisi supaya Notulis tahu apa yang harus diperbaiki
            'revision_note' => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'revision_note.required' => 'Catatan revisi wajib diisi saat menolak notulen.',
        ];
    }
}