<?php

namespace App\Support;

/**
 * Menyiapkan gambar lampiran untuk PDF: dikecilkan, diputar sesuai EXIF, dan dikirim sebagai data URI.
 * Foto langsung dari HP (beberapa MB) bisa membuat dompdf kehabisan memori dan gambarnya hilang diam-diam.
 */
class PdfImage
{
    public static function dataUri(string $binary, int $maxWidth = 1200): ?string
    {
        if (! function_exists('imagecreatefromstring')) {
            // Tanpa GD: kirim apa adanya.
            return 'data:image/jpeg;base64,'.base64_encode($binary);
        }

        $image = @imagecreatefromstring($binary);

        if (! $image) {
            return null;
        }

        $image = self::applyExifOrientation($image, $binary);

        if (imagesx($image) > $maxWidth) {
            $scaled = imagescale($image, $maxWidth);

            if ($scaled) {
                imagedestroy($image);
                $image = $scaled;
            }
        }

        $width = imagesx($image);
        $height = imagesy($image);

        // Latar putih supaya PNG transparan tidak menjadi hitam setelah dijadikan JPEG.
        $canvas = imagecreatetruecolor($width, $height);
        imagefill($canvas, 0, 0, imagecolorallocate($canvas, 255, 255, 255));
        imagecopy($canvas, $image, 0, 0, 0, 0, $width, $height);
        imagedestroy($image);

        ob_start();
        imagejpeg($canvas, null, 80);
        $jpeg = ob_get_clean();
        imagedestroy($canvas);

        return 'data:image/jpeg;base64,'.base64_encode($jpeg);
    }

    private static function applyExifOrientation($image, string $binary)
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        try {
            $exif = @exif_read_data('data://image/jpeg;base64,'.base64_encode($binary));
        } catch (\Throwable) {
            return $image;
        }

        $angle = match ($exif['Orientation'] ?? 1) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $image;
        }

        $rotated = imagerotate($image, $angle, 0);

        if ($rotated) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }
}