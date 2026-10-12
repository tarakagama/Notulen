// meta = objek paginator Laravel (current_page, last_page, total)
export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
      <span>
        Halaman {meta.current_page} dari {meta.last_page} · {meta.total} data
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(meta.current_page - 1)}
          disabled={meta.current_page <= 1}
          className="border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => onPage(meta.current_page + 1)}
          disabled={meta.current_page >= meta.last_page}
          className="border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}