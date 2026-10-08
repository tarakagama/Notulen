<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\MeetingAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MeetingAttachmentController extends Controller
{
    public function store(Request $request, Meeting $meeting)
    {
        $this->authorize('update', $meeting);

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'], // max 10MB
            'file_type' => ['required', 'in:Scan Daftar Hadir,Dokumentasi Foto,Lainnya'],
        ]);

        $path = $request->file('file')->store('meeting-attachments', MeetingAttachment::DISK);

        $attachment = $meeting->attachments()->create([
            'file_type' => $request->input('file_type'),
            'file_path' => $path,
        ]);

        // 'url' ikut terserialisasi lewat $appends (URL bertanda tangan sementara)
        return response()->json($attachment, 201);
    }

    public function destroy(Meeting $meeting, MeetingAttachment $attachment)
    {
        $this->authorize('update', $meeting);

        abort_unless($attachment->meeting_id === $meeting->id, 404);

        Storage::disk(MeetingAttachment::DISK)->delete($attachment->file_path);
        // Sisa berkas lama yang belum dipindah dari disk publik
        Storage::disk('public')->delete($attachment->file_path);

        $attachment->delete();

        return response()->noContent();
    }
}