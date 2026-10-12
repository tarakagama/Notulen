import { useState } from 'react';
import { X } from 'lucide-react';

// Pilih banyak user: kotak cari + daftar centang + chip yang terpilih.
export default function InviteePicker({ users, selectedIds, onChange }) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) => !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  );
  const selected = users.filter((u) => selectedIds.includes(u.id));

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded px-2 py-1">
              {u.full_name}
              <button type="button" onClick={() => toggle(u.id)} className="hover:text-blue-900">
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau email..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />

      <div className="mt-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded divide-y divide-gray-50">
        {visible.length === 0 ? (
          <p className="text-xs text-gray-400 px-3 py-2">Tidak ada user ditemukan.</p>
        ) : (
          visible.map((u) => (
            <label key={u.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => toggle(u.id)}
                className="w-4 h-4 accent-[#0f2557]"
              />
              <span>{u.full_name}</span>
              <span className="text-xs text-gray-400">{u.email}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}