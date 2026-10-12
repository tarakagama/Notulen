<?php

namespace App\Notifications;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Throwable;

/**
 * Notifikasi in-app generik (disimpan di tabel notifications, dibaca lewat lonceng).
 * Satu kelas dipakai untuk semua kejadian; bedanya hanya type, judul, isi, dan tautan.
 */
class AppNotification extends Notification
{
    public function __construct(
        public string $type,
        public string $title,
        public ?string $body = null,
        public ?string $link = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'link' => $this->link,
        ];
    }

    /**
     * Kirim ke satu user atau banyak user.
     * Kegagalan notifikasi tidak boleh membatalkan aksi utamanya, jadi hanya dilaporkan.
     */
    public static function send($users, string $type, string $title, ?string $body = null, ?string $link = null): void
    {
        $users = $users instanceof Model ? collect([$users]) : collect($users);
        $users = $users->filter()->unique('id')->values();

        if ($users->isEmpty()) {
            return;
        }

        try {
            NotificationFacade::send($users, new static($type, $title, $body, $link));
        } catch (Throwable $e) {
            report($e);
        }
    }
}