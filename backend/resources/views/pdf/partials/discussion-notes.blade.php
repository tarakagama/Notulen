@php
    // Pola: level 0 = angka (1.), level 1 = huruf+kurung (a)), level 2+ = romawi+kurung (i))
    if (! function_exists('formatNoteNumber')) {
        function formatNoteNumber($depth, $index)
        {
            return match (true) {
                $depth === 0 => $index . '.',
                $depth === 1 => chr(96 + $index) . ')',
                default => strtolower(numberToRoman($index)) . ')', // level 2 dst tetap romawi, nggak ngulang ke 'a' lagi
            };
        }
    }

    if (! function_exists('numberToRoman')) {
        function numberToRoman($num)
        {
            $map = ['M'=>1000,'CM'=>900,'D'=>500,'CD'=>400,'C'=>100,'XC'=>90,'L'=>50,'XL'=>40,'X'=>10,'IX'=>9,'V'=>5,'IV'=>4,'I'=>1];
            $result = '';
            foreach ($map as $roman => $value) {
                while ($num >= $value) {
                    $result .= $roman;
                    $num -= $value;
                }
            }
            return $result;
        }
    }
@endphp

<div style="margin-left: {{ $depth * 18 }}px;">
    @foreach ($notes as $i => $note)
        <div class="discussion-note">
            {{ formatNoteNumber($depth, $i + 1) }}
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