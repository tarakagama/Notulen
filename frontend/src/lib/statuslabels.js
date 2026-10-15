// File ini penghubung yang dipakai di semua halaman yang nampilin status.

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

// ── v2 ────────────────────────────────────────────────────────────────

export const ROLE_TO_LABEL = {
  SuperAdmin: 'Super Admin',
  AdminDivisi: 'Admin Divisi',
  User: 'User',
  Viewer: 'Viewer',
};

export const BOOKING_STATUS_TO_LABEL = {
  Pending: 'Menunggu',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
  Cancelled: 'Dibatalkan',
};

export const VISIBILITY_TO_LABEL = {
  Public: 'Publik',
  Division: 'Divisi',
  Restricted: 'Terbatas',
};

export const UNLOCK_STATUS_TO_LABEL = {
  None: '-',
  Requested: 'Menunggu persetujuan unlock',
  Approved: 'Unlock disetujui',
  Rejected: 'Unlock ditolak',
};

export function roleLabel(role) {
  return ROLE_TO_LABEL[role] || role || '-';
}

export function bookingStatusLabel(status) {
  return BOOKING_STATUS_TO_LABEL[status] || status;
}

export function visibilityLabel(visibility) {
  return VISIBILITY_TO_LABEL[visibility] || visibility;
}