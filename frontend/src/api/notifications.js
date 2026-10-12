import api from './client';

// Paginator Laravel + { unread_count }. params: { per_page?, unread?, page? }
export async function listNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params });
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data; // { unread_count }
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/notifications/read-all');
  return data; // { unread_count: 0 }
}