@php
    // Pola penomoran berjenjang sesuai contoh notulen asli: 1 -> a -> 1) -> 1.
    // Kalau depth lebih dari 4, ulang lagi dari pola angka biasa.
    $numberingStyles = ['decimal', 'lower-alpha', 'decimal-paren', 'decimal-dot'];
    $style = $numberingStyles[$depth % count($numberingStyles)];

    // Partial ini di-include secara REKURSIF (satu kali per level nesting),
    // jadi function harus dijaga biar cuma ke-declare sekali (kalau nggak,
    // "Cannot redeclare" fatal error pas ada Pembahasan yang beneran nested).
    if (! function_exists('formatNoteNumber')) {
        function formatNoteNumber($style, $index)
        {
            return match ($style) {
                'lower-alpha' => chr(96 + $index) . '.', // a. b. c.
                'decimal-paren' => $index . ')',           // 1) 2) 3)
                'decimal-dot' => $index . '.',             // 1. 2. 3.
                default => $index . '.',                   // 1. 2. 3. (level teratas)
            };
        }
    }
@endphp

<div style="margin-left: {{ $depth * 18 }}px;">
    @foreach ($notes as $i => $note)
        <div class="discussion-note">
            {{ formatNoteNumber($style, $i + 1) }}
            {!! $note->content !!}
            @if ($note->category)
                <span class="category-tag category-{{ $note->category === 'Bug/Error' ? 'bug' : ($note->category === 'SOP' ? 'sop' : 'new') }}">
                    {{ $note->category }}
                </span>
            @endif
            @if ($note->speaker_group)
                <br><small style="color:#777;">— {{ $note->speaker_group }}</small>
            @endif
        </div>

        @if ($note->childNotesRecursive->isNotEmpty())
            @include('pdf.partials.discussion-notes', ['notes' => $note->childNotesRecursive, 'depth' => $depth + 1])
        @endif
    @endforeach
</div>