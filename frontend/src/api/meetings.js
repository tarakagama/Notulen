import api from './client';

export async function listMeetings(params = {}) {
  const { data } = await api.get('/meetings', { params });
  return data;
}

export async function getMeeting(id) {
  const { data } = await api.get(`/meetings/${id}`);
  return data;
}

export async function createMeeting(payload) {
  const { data } = await api.post('/meetings', payload);
  return data;
}

export async function updateMeeting(id, payload) {
  const { data } = await api.put(`/meetings/${id}`, payload);
  return data;
}

export async function deleteMeeting(id) {
  await api.delete(`/meetings/${id}`);
}

export async function submitMeeting(id) {
  const { data } = await api.post(`/meetings/${id}/submit`);
  return data;
}

export async function approveMeeting(id) {
  const { data } = await api.post(`/meetings/${id}/approve`);
  return data;
}

export async function rejectMeeting(id, revisionNote) {
  const { data } = await api.post(`/meetings/${id}/reject`, { revision_note: revisionNote });
  return data;
}

export async function listPendingApprovals(params = {}) {
  const { data } = await api.get('/meetings/pending-approvals', { params });
  return data;
}

export async function exportMeetingPdf(id, filename = 'notulen.pdf') {
  const response = await api.get(`/meetings/${id}/export`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}