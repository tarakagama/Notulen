// Backend pakai enum Inggris, UI kamu udah didesain pakai label Indonesia.
// File ini jembatannya — dipakai di semua halaman yang nampilin status.

export const MEETING_STATUS_TO_LABEL = {
  Draft: 'Draft',
  'Waiting Approval': 'Menunggu Approval',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
};

export const MEETING_LABEL_TO_STATUS = Object.fromEntries(
  Object.entries(MEETING_STATUS_TO_LABEL).map(([k, v]) => [v, k])
);

export const ACTION_ITEM_STATUS_TO_LABEL = {
  Open: 'Belum Mulai',
  'In Progress': 'Berjalan',
  Overdue: 'Terlambat',
  Completed: 'Selesai',
};

export const ACTION_ITEM_LABEL_TO_STATUS = Object.fromEntries(
  Object.entries(ACTION_ITEM_STATUS_TO_LABEL).map(([k, v]) => [v, k])
);

export function meetingStatusLabel(status) {
  return MEETING_STATUS_TO_LABEL[status] || status;
}

export function actionItemStatusLabel(status) {
  return ACTION_ITEM_STATUS_TO_LABEL[status] || status;
}