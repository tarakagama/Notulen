<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActionItemStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actionItem = $this->route('action_item') ?? $this->route('actionItem');

        return $actionItem && $this->user()->can('updateStatus', $actionItem);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:Open,In Progress,Overdue,Completed'],
            'completion_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}