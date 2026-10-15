<ol>
@foreach ($notes as $note)
<li>{!! $note->content !!}@if ($note->category) (Kategori: {{ $note->category }})@endif @if ($note->speaker_group)<em>— {{ $note->speaker_group }}</em>@endif
@if ($note->childNotesRecursive->isNotEmpty())
@include('pdf.partials.discussion-notes', ['notes' => $note->childNotesRecursive])
@endif
</li>
@endforeach
</ol>