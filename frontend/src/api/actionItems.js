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