// value: true = Hadir, false = Tidak Hadir, null/undefined = Belum dikonfirmasi
export default function AttendanceBadge({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">Belum dikonfirmasi</span>;
  }

  return value ? (
    <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">Hadir</span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700">Tidak Hadir</span>
  );
}