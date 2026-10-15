<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Support\PdfImage;

class MeetingAttachment extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'uploaded_at';
    const UPDATED_AT = null;

    /**
     * Berkas disimpan di disk privat ('local'), bukan 'public'.
     * Akses lewat URL bertanda tangan yang kedaluwarsa (NFR-SEC-02).
     */
    public const DISK = 'local';

    public const URL_TTL_MINUTES = 30;

    protected $fillable = [
        'meeting_id',
        'file_type',
        'file_path',
        'uploaded_at',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    /**
     * URL sementara (bertanda tangan). Dibuat hanya saat notulen
     * dimuat oleh user yang berhak melihatnya, lalu kedaluwarsa sendiri.
     */
    public function url(): Attribute
    {
        return Attribute::get(fn () => Storage::disk(self::DISK)->temporaryUrl(
            $this->file_path,
            now()->addMinutes(self::URL_TTL_MINUTES)
        ));
    }

    /**
     * Gambar untuk dicetak di PDF (data URI, sudah dikecilkan). null kalau berkas tidak ada atau bukan gambar.
     * Mencari di disk privat dulu, lalu disk publik untuk berkas lama yang belum dipindah.
     */
    public function pdfImageSrc(int $maxWidth = 1200): ?string
    {
        foreach ([self::DISK, 'public'] as $disk) {
            if (Storage::disk($disk)->exists($this->file_path)) {
                return PdfImage::dataUri(Storage::disk($disk)->get($this->file_path), $maxWidth);
            }
        }

        return null;
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}