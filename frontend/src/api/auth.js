import api from './client';

export async function login(email, password) {
  const { data } = await api.post('/login', { email, password });
  return data; // { user, token }
}

export async function logout() {
  await api.post('/logout');
}

export async function fetchMe() {
  const { data } = await api.get('/me');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/profile', payload);
  return data;
}

export async function updatePassword(payload) {
  const { data } = await api.put('/profile/password', payload);
  return data;
}