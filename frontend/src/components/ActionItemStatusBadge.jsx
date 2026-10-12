import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react';
import { ACTION_ITEM_STATUS_TO_LABEL } from '../lib/statuslabels';

const STYLE = {
  Open: 'text-gray-700 bg-gray-100',
  'In Progress': 'text-blue-700 bg-blue-50',
  Overdue: 'text-red-700 bg-red-50',
  Completed: 'text-green-700 bg-green-50',
};

const ICON = {
  Open: Circle,
  'In Progress': Clock,
  Overdue: AlertTriangle,
  Completed: CheckCircle2,
};

// status = effective_status dari backend (Open | In Progress | Overdue | Completed)
export default function ActionItemStatusBadge({ status }) {
  const Icon = ICON[status] || Circle;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded ${STYLE[status] || STYLE.Open}`}>
      <Icon size={12} />
      {ACTION_ITEM_STATUS_TO_LABEL[status] || status}
    </span>
  );
}