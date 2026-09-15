<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActionItemStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        // FR-3.5: hanya pic_id = current_user, atau admin
        return $this->user()->can('updateStatus', $this->route('action_item'));
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:Open,In Progress,Overdue,Completed'],
            'completion_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}