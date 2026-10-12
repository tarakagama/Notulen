// Backend menyimpan waktu apa adanya (wall-clock) dan mengirimnya sebagai
// "2026-12-01T09:00:00.000000Z" atau "2026-12-01 09:00:00".

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const dateOf = (value) => (value ? String(value).slice(0, 10) : '');
export const timeOf = (value) => (value ? String(value).slice(11, 16) : '');

// '2026-12-01...' -> '1 Des 2026'
export function formatDate(value) {
  const d = dateOf(value);
  if (!d) return '-';
  const [y, m, day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`;
}

// Satu hari: '1 Des 2026, 09:00–10:00'. Beda hari: '1 Des 2026 09:00 – 2 Des 2026 10:00'.
export function formatRange(start, end) {
  if (!start) return '-';
  if (dateOf(start) === dateOf(end)) {
    return `${formatDate(start)}, ${timeOf(start)}–${timeOf(end)}`;
  }
  return `${formatDate(start)} ${timeOf(start)} – ${formatDate(end)} ${timeOf(end)}`;
}

// Format kirim ke API booking: 'YYYY-MM-DD HH:mm:ss'
export function toApiDateTime(date, time) {
  return `${date} ${time}:00`;
}

// Tanggal hari ini menurut jam lokal browser, 'YYYY-MM-DD'
export function todayString() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}