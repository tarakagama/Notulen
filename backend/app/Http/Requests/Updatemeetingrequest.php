<?php

namespace App\Http\Requests;

use App\Models\Meeting;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Meeting $meeting */
        $meeting = $this->route('meeting');

        // FR-1.8: hanya notulis pemilik, hanya saat Draft/Rejected.
        // Delegasikan ke MeetingPolicy biar aturan satu sumber saja.
        return $this->user()->can('update', $meeting);
    }

    public function rules(): array
    {
        // Sama seperti StoreMeetingRequest — field yang boleh diubah identik.
        return (new StoreMeetingRequest())->rules();
    }

    public function messages(): array
    {
        return (new StoreMeetingRequest())->messages();
    }
}