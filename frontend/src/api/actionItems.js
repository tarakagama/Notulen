import api from './client';

export async function listActionItems(params = {}) {
  const { data } = await api.get('/action-items', { params });
  return data;
}

export async function listMyTasks(params = {}) {
  const { data } = await api.get('/my-tasks', { params });
  return data;
}

export async function updateActionItemStatus(id, payload) {
  const { data } = await api.patch(`/action-items/${id}/status`, payload);
  return data;
}

// Antrean verifikasi untuk notulis / approver rapat
export async function listToVerify(params = {}) {
  const { data } = await api.get('/action-items/to-verify', { params });
  return data;
}

// payload: { approved: boolean, note?: string } (note wajib jika approved = false)
export async function verifyActionItem(id, payload) {
  const { data } = await api.post(`/action-items/${id}/verify`, payload);
  return data;
}

export async function getActionItemLogs(id) {
  const { data } = await api.get(`/action-items/${id}/logs`);
  return data;
}