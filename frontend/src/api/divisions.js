import api from './client';

export async function listDivisions() {
  const { data } = await api.get('/divisions');
  return data; // array [{ id, division_name, code }]
}

export async function createDivision(payload) {
  const { data } = await api.post('/divisions', payload);
  return data;
}

export async function updateDivision(id, payload) {
  const { data } = await api.put(`/divisions/${id}`, payload);
  return data;
}

export async function deleteDivision(id) {
  await api.delete(`/divisions/${id}`);
}