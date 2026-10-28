import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { listMeetings } from '../api/meetings';
import { useAuth } from '../context/AuthContext';


function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GlobalSearch() {
  const { isRoomPic } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= 2;

  // Cari ke backend, ditunda 300ms biar gak nembak API tiap ketikan
  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      listMeetings({ search: trimmed, per_page: 6 })
        .then((res) => {
          if (cancelled) return;
          setResults(res.data || []);
          setActive(0);
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true; // abaikan respons lama kalau user keburu ngetik lagi
      clearTimeout(timer);
    };
  }, [trimmed]);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goTo = (meeting) => {
    navigate(`/notulen/${meeting.id}`);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      goTo(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (isRoomPic) return null;

    return (
    <div className="relative" ref={boxRef}>
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Cari notulen..."
        className="pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded w-80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      {loading && (
        <Loader2 size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
      )}

      {showDropdown && (
        <div className="absolute right-0 mt-1 w-[28rem] bg-white border border-gray-200 rounded shadow-sm z-50 overflow-hidden">
          {!loading && results.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-4">Tidak ada notulen yang cocok dengan "{trimmed}".</p>
          ) : (
            results.map((m, i) => (
              <button
                key={m.id}
                onClick={() => goTo(m)}
                onMouseEnter={() => setActive(i)}
                className={`block w-full text-left px-5 py-3 border-b border-gray-50 last:border-b-0 ${
                  i === active ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <p className="text-base text-gray-800 truncate">{m.meeting_title}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {formatDate(m.meeting_date)} · {m.notulis?.full_name || '-'}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}