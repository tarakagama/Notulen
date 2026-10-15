{{--
  resources/views/pdf/meeting-pdf.blade.php
  Template PDF notulen MoMHub — meniru format notulen PLN EPI (Word) pada A4.
  Dipanggil: Pdf::loadView('pdf.meeting-pdf', ['meeting' => $meeting])
  Relasi yang dipakai: notulis, attendees, attachments, discussionNotes (+ childNotesRecursive)
--}}
@php
    $logoFile = public_path('images/logo-plnepi.png');
    $logoSrc  = is_file($logoFile) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoFile)) : null;

    $tanggal = \Carbon\Carbon::parse($meeting->meeting_date)->locale('id')->translatedFormat('j F Y');
    $waktu   = str_replace(':', '.', substr($meeting->start_time, 0, 5)).' s.d '.str_replace(':', '.', substr($meeting->end_time, 0, 5)).' WIB';
    $notulis = $meeting->notulis->full_name ?? '-';

    // Gambar lampiran per jenis (kolom file_type), hanya jpg/jpeg/png yang ada di disk
    // Gambar lampiran per jenis (kolom file_type), hanya jpg/jpeg/png. Dikirim sebagai data URI
    // (sudah dikecilkan) karena berkas ada di penyimpanan privat, bukan di folder public.
    $imagesOf = function ($type, $maxWidth) use ($meeting) {
        return $meeting->attachments
            ->filter(fn ($a) => $a->file_type === $type
                && in_array(strtolower(pathinfo($a->file_path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png']))
            ->map(fn ($a) => $a->pdfImageSrc($maxWidth))
            ->filter()
            ->values()->all();
    };
    $scanImages  = $imagesOf('Scan Daftar Hadir', 1600); // scan butuh lebih tajam supaya tulisan terbaca
    $photoImages = $imagesOf('Dokumentasi Foto', 1200);

    // Huruf bagian (A, B, C, ...) dihitung otomatis, bagian kosong dilewati
    $letterIndex = 0;
    $nextLetter  = function () use (&$letterIndex) { return chr(65 + $letterIndex++); };
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>{{ $meeting->meeting_title }}</title>
<style>
    /* Halaman: A4, isi mulai tepat di bawah garis atas bingkai (60,6 pt) */
    @page { size: A4 portrait; margin: 61.1pt 29.6pt 63.5pt 33.6pt; }
    * { box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 14.23pt; color: #000; }

    /* ===== Elemen yang berulang di setiap halaman ===== */
    .frame { position: fixed; left: -0.24pt; top: -0.5pt; width: 531.6pt; height: 718.08pt; border: 0.48pt solid #000; }
    .logo  { position: fixed; left: -0.4pt; top: -43.9pt; width: 107.5pt; }
    .pagenum { position: fixed; left: 0; top: 734.4pt; width: 511.5pt; text-align: right; font-size: 9.5pt; line-height: 11pt; }
    .pagenum:after { content: counter(page); }

    /* ===== Tabel kepala (halaman 1) ===== */
    table.hdr { width: 532.08pt; border-collapse: collapse; margin: -0.5pt 0 0 0; }
    table.hdr td { border: 0.48pt solid #000; padding: 0 5.4pt; font-weight: bold; vertical-align: middle; line-height: 13pt; overflow: hidden; }
    table.hdr .r1 td { height: 19.3pt; }
    table.hdr .r2 td { height: 20.6pt; }
    table.hdr .r3 td { height: 17.5pt; }
    table.hdr .r4 td { height: 17.6pt; }
    table.hdr .r5 td { height: 27pt; }

    /* ===== Isi ===== */
    .content { padding: 0 5.4pt; }
    .sec { font-weight: bold; margin-top: 23.4pt; line-height: 11.8pt; page-break-after: avoid; }
    .sec.first { margin-top: 1.45pt; }
    .sec .no { display: inline-block; width: 19pt; position: relative; top: 2.4pt; }
    .sec .ttl { text-decoration: underline; }
    .newpage { page-break-before: always; margin-top: 2.4pt; }
    .sec.newpage.d { margin-top: 16.9pt; }

    /* Rich text (Tiptap) */
    .rt p { margin: 0; text-align: justify; min-height: 14.48pt; }
    .rt strong, .rt b { font-weight: bold; }
    .rt em, .rt i { font-style: italic; }
    .rt u { text-decoration: underline; }
    .rt ol, .rt ul { margin: 0; padding: 0; list-style: none; text-indent: 0; }
    .rt li { margin: 0 0 0 18pt; padding: 0; text-indent: -18pt; text-align: justify; }
    .rt li > p { display: inline; margin: 0; min-height: 0; }
    .rt li:before { display: inline-block; width: 18pt; text-indent: 0; position: relative; top: 3pt; }
    .rt ol > li { margin-left: 37.6pt; }
    .rt ol ol > li { margin-left: 18pt; }
    .rt ol ol ol > li { margin-left: 18.5pt; }
    .rt ol ol ol ol > li { margin-left: 21.3pt; }
    .rt ol ol ol ol ol > li { margin-left: 18pt; }
    .rt ul > li { margin-left: 37.6pt; }
    .rt ul ul > li, .rt ol ul > li, .rt ul ol > li { margin-left: 18pt; }
    .rt ol { counter-reset: c1; }
    .rt ol ol { counter-reset: c2; }
    .rt ol ol ol { counter-reset: c3; }
    .rt ol ol ol ol { counter-reset: c4; }
    .rt ol ol ol ol ol { counter-reset: c5; }
    .rt ol > li { counter-increment: c1; }
    .rt ol ol > li { counter-increment: c2; }
    .rt ol ol ol > li { counter-increment: c3; }
    .rt ol ol ol ol > li { counter-increment: c4; }
    .rt ol ol ol ol ol > li { counter-increment: c5; }
    .rt ol > li:before { content: counter(c1) "."; }
    .rt ol ol > li:before { content: counter(c2, lower-alpha) "."; }
    .rt ol ol ol > li:before { content: counter(c3) ")"; }
    .rt ol ol ol ol > li:before { content: counter(c4) "."; }
    .rt ol ol ol ol ol > li:before { content: counter(c5, lower-alpha) ")"; }
    .rt ul > li:before, .rt ul ul > li:before, .rt ol ul > li:before, .rt ul ol > li:before { content: "\2022"; }

    /* Daftar hadir & dokumentasi */
    table.att { width: 467.6pt; border-collapse: collapse; }
    table.att th, table.att td { border: 0.48pt solid #000; padding: 0 5.4pt; height: 24pt; vertical-align: middle; font-size: 10pt; line-height: 12pt; }
    table.att th { font-weight: bold; text-align: center; background: #fff; height: 22pt; }
    table.att td.c { text-align: center; }
    .scan { display: block; width: 467.6pt; margin: 1pt 0 0 21.3pt; }
    .foto { display: block; width: 453.5pt; margin: 0.9pt 0 0 21.3pt; }
</style>
</head>
<body>
    <div class="frame"></div>
    @if($logoSrc)
        <img class="logo" src="{{ $logoSrc }}" alt="PLN EPI">
    @endif
    <div class="pagenum"></div>

    <table class="hdr">
        <tr class="r1">
            <td colspan="2" rowspan="3" style="width: 281.1pt">NOTULEN RAPAT/PERTEMUAN</td>
            <td style="width: 45.2pt">Tanggal</td>
            <td style="width: 171.8pt">{{ $tanggal }}</td>
        </tr>
        <tr class="r2"><td>Waktu</td><td>{{ $waktu }}</td></tr>
        <tr class="r3"><td>Tempat</td><td>{{ $meeting->location }}</td></tr>
        <tr class="r4">
            <td style="width: 73.7pt">Daftar Hadir</td><td style="width: 196.1pt">Terlampir</td><td>Notulis</td><td>{{ $notulis }}</td>
        </tr>
        <tr class="r5">
            <td>Agenda</td><td colspan="3">{{ $meeting->agenda ?: $meeting->meeting_title }}</td>
        </tr>
    </table>

    <div class="content">
        @if($meeting->background)
            <div class="sec first"><span class="no">{{ $nextLetter() }}.</span><span class="ttl">LATAR BELAKANG</span></div>
            <div class="rt">{!! $meeting->background !!}</div>
        @endif

        <div class="sec {{ $meeting->background ? '' : 'first' }}"><span class="no">{{ $nextLetter() }}.</span><span class="ttl">PEMBAHASAN</span></div>
        <div class="rt">
        @if($meeting->discussion_mode === 'manual')
            {!! $meeting->discussion_manual_content !!}
        @elseif($meeting->discussionNotes->isEmpty())
            <p>Tidak ada catatan pembahasan.</p>
        @else
            @include('pdf.partials.discussion-notes', ['notes' => $meeting->discussionNotes])
        @endif
        </div>

        @if($meeting->conclusion)
            <div class="sec"><span class="no">{{ $nextLetter() }}.</span><span class="ttl">KESEPAKATAN DAN TINDAK LANJUT</span></div>
            <div class="rt">{!! $meeting->conclusion !!}</div>
        @endif

        <div class="sec newpage d"><span class="no">{{ $nextLetter() }}.</span><span class="ttl">DAFTAR HADIR</span></div>
        @if(count($scanImages) > 0)
            @foreach($scanImages as $i => $img)
                <img class="scan" src="{{ $img }}" alt="Scan daftar hadir" style="{{ $i > 0 ? 'page-break-before: always;' : '' }}">
            @endforeach
        @elseif($meeting->attendees->isEmpty())
            <p>Tidak ada data daftar hadir digital.</p>
        @else
            <table class="att" style="margin-left: 21.3pt; margin-top: 8pt;">
                <tr><th style="width: 21pt">NO.</th><th style="width: 139pt">NAMA</th><th style="width: 129pt">DIVISI / INSTANSI</th><th style="width: 69pt">KEHADIRAN</th><th style="width: 54.6pt">TTD</th></tr>
                @foreach($meeting->attendees as $n => $a)
                    <tr>
                        <td class="c">{{ $n + 1 }}</td>
                        <td>{{ $a->name }}</td>
                        <td>{{ $a->division ?: '-' }}</td>
                        <td class="c">{{ is_null($a->is_present) ? '-' : ($a->is_present ? 'Hadir' : 'Tidak Hadir') }}</td>
                        <td></td>
                    </tr>
                @endforeach
            </table>
        @endif

        @if(count($photoImages) > 0)
            <div class="sec newpage"><span class="no">{{ $nextLetter() }}.</span><span class="ttl">DOKUMENTASI</span></div>
            @foreach($photoImages as $img)
                <img class="foto" src="{{ $img }}" alt="Dokumentasi">
            @endforeach
        @endif
    </div>
</body>
</html>