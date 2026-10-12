import { bookingStatusLabel } from '../lib/statuslabels';

const STYLE = {
  Pending: 'bg-amber-50 text-amber-700',
  Approved: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export default function BookingStatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded text-xs ${STYLE[status] || STYLE.Cancelled}`}>
      {bookingStatusLabel(status)}
    </span>
  );
}