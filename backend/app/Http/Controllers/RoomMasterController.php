<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Master data ruangan (FR-RM-01): tambah, ubah, nonaktifkan, hapus.
 * Boleh untuk SuperAdmin dan pengelola ruangan (can_manage_rooms) lewat RoomPolicy::manage.
 * Pemesanan ruangan ada di RoomController.
 */
class RoomMasterController extends Controller
{
    private const AUDIT_FIELDS = ['room_name', 'building', 'floor', 'capacity', 'facilities', 'is_active'];

    public function store(Request $request)
    {
        $this->authorize('manage', Room::class);

        $data = $this->validated($request);
        $data['is_active'] = $data['is_active'] ?? true;

        $room = Room::create($data);

        AuditLog::record('CREATE_ROOM', Room::class, $room->id, [], $room->only(self::AUDIT_FIELDS));

        return response()->json($room, 201);
    }

    public function update(Request $request, Room $room)
    {
        $this->authorize('manage', Room::class);

        $old = $room->only(self::AUDIT_FIELDS);
        $wasActive = $room->is_active;

        $room->update($this->validated($request, $room));

        $action = match (true) {
            $wasActive && ! $room->is_active => 'DEACTIVATE_ROOM',
            ! $wasActive && $room->is_active => 'ACTIVATE_ROOM',
            default => 'UPDATE_ROOM',
        };

        AuditLog::record($action, Room::class, $room->id, $old, $room->only(self::AUDIT_FIELDS));

        return $room->fresh();
    }

    /**
     * Ruangan yang sudah punya riwayat booking tidak bisa dihapus (FK, dan riwayatnya harus utuh).
     * Cukup dinonaktifkan lewat is_active.
     */
    public function destroy(Room $room)
    {
        $this->authorize('manage', Room::class);

        if ($room->bookings()->exists()) {
            return response()->json([
                'message' => 'Ruangan ini sudah punya riwayat booking, jadi tidak bisa dihapus. '
                    .'Nonaktifkan saja supaya tidak muncul di pilihan booking.',
            ], 422);
        }

        $old = $room->only(self::AUDIT_FIELDS);
        $room->delete();

        AuditLog::record('DELETE_ROOM', Room::class, $room->id, $old, []);

        return response()->noContent();
    }

    private function validated(Request $request, ?Room $room = null): array
    {
        $data = $request->validate([
            'room_name' => [
                'required', 'string', 'max:100',
                // Nama boleh sama di gedung yang berbeda, tapi unik dalam satu gedung.
                Rule::unique('rooms', 'room_name')
                    ->where('building', $request->input('building'))
                    ->ignore($room?->id),
            ],
            'building' => ['required', 'string', 'max:100'],
            'floor' => ['required', 'string', 'max:20'],
            'capacity' => ['required', 'integer', 'min:1', 'max:10000'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'room_name.unique' => 'Nama ruangan sudah dipakai di gedung ini.',
        ]);

        if (array_key_exists('facilities', $data)) {
            $data['facilities'] = collect($data['facilities'] ?? [])
                ->map(fn ($f) => trim($f))
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        return $data;
    }
}