<?php

return [
    // Jam operasional pemesanan ruang rapat (jam dinding, format HH:MM).
    // Booking hanya diterima di antara jam buka dan jam tutup, dalam satu hari yang sama.
    'open_time' => env('BOOKING_OPEN_TIME', '08:00'),
    'close_time' => env('BOOKING_CLOSE_TIME', '16:00'),
];