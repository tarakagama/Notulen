<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Semua user login boleh bikin notulen baru (FR-4.4)
        return true;
    }

    public function rules(): array
    {
        return [
            // ── Metadata rapat (FR-1.1) ──────────────────────────────
            'meeting_title' => ['required', 'string', 'max:255'],
            'meeting_type' => ['nullable', 'string', 'max:100'],
            'meeting_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'location' => ['nullable', 'string', 'max:255'],
            'agenda' => ['required', 'string'],
            'background' => ['nullable', 'string'],
            'conclusion' => ['nullable', 'string'],
            'discussion_mode' => ['nullable', 'in:outline,manual'],
            'discussion_manual_content' => ['nullable', 'string'],
            'approver_id' => ['nullable', 'exists:users,id'],

            // ── Daftar hadir (FR-1.2) ────────────────────────────────
            // internal: user_id diisi, external: external_name diisi
            'attendees' => ['nullable', 'array'],
            'attendees.*.user_id' => ['nullable', 'exists:users,id', 'required_without:attendees.*.external_name'],
            'attendees.*.external_name' => ['nullable', 'string', 'max:150', 'required_without:attendees.*.user_id'],
            'attendees.*.external_org' => ['nullable', 'string', 'max:150'],
            'attendees.*.role_in_meeting' => ['nullable', 'string', 'max:100'],
            'attendees.*.is_signed' => ['nullable', 'boolean'],

            // ── Pembahasan nested (FR-1.3, FR-1.4) ───────────────────
            // parent_note_id di sini adalah TEMP_ID (string) dari note lain
            // dalam payload yang sama, BUKAN id asli dari DB — remapping
            // ke id asli dilakukan di MeetingController::syncDiscussionNotes.
            'discussion_notes' => ['nullable', 'array'],
            'discussion_notes.*.temp_id' => ['nullable', 'string'],
            'discussion_notes.*.content' => ['required', 'string'],
            'discussion_notes.*.parent_note_id' => ['nullable', 'string'],
            'discussion_notes.*.order_in_level' => ['required', 'integer', 'min:0'],
            'discussion_notes.*.speaker_group' => ['nullable', 'string', 'max:150'],
            'discussion_notes.*.category' => ['nullable', 'in:Bug/Error,SOP,New Requirement'],

            // ── Action items (FR-1.5, FR-1.6) ────────────────────────
            // Boleh kosong total (FR-1.6: rapat tanpa action item itu sah)
            'action_items' => ['nullable', 'array'],
            'action_items.*.description' => ['required', 'string'],
            'action_items.*.pic_id' => ['required', 'exists:users,id'],
            'action_items.*.deadline' => ['required', 'date', 'after_or_equal:today'],
            'action_items.*.priority' => ['required', 'in:Low,Medium,High'],
        ];
    }

    public function messages(): array
    {
        return [
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
            'action_items.*.deadline.after_or_equal' => 'Deadline tidak boleh di masa lalu.',
            'attendees.*.user_id.required_without' => 'Isi salah satu: user internal atau nama eksternal.',
            'attendees.*.external_name.required_without' => 'Isi salah satu: user internal atau nama eksternal.',
        ];
    }
}