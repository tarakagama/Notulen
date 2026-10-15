import { useState } from 'react';
import { X } from 'lucide-react';

// Input banyak tag (mis. fasilitas): ketik lalu Enter atau koma, atau klik saran.
export default function TagInput({ value, onChange, suggestions = [], placeholder = 'Ketik lalu tekan Enter' }) {
  const [text, setText] = useState('');

  const has = (t) => value.some((v) => v.toLowerCase() === t.toLowerCase());

  const add = (raw) => {
    const t = raw.trim();
    if (!t || has(t)) return;
    onChange([...value, t]);
  };

  const commit = () => {
    add(text);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((s) => !has(s));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border border-gray-300 rounded px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded px-2 py-1">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== tag))} className="hover:text-blue-900">
              <X size={12} strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={value.length ? '' : placeholder}
          className="flex-1 min-w-[8rem] text-sm outline-none py-0.5"
        />
      </div>

      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs border border-dashed border-gray-300 text-gray-500 rounded px-2 py-0.5 hover:border-blue-400 hover:text-blue-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}