import api from './client';

export async function fetchDashboardSummary(params = {}) {
  const { data } = await api.get('/dashboard/summary', { params });
  return data;
}

export async function fetchTopOverdue(params = {}) {
  const { data } = await api.get('/dashboard/top-overdue', { params });
  return data;
}