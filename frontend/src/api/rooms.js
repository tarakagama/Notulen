import api from './client';

export async function listRooms() {
  const { data } = await api.get('/rooms');
  return data; // array ruangan aktif
}

// params: { start_time, end_time, room_id? } format 'YYYY-MM-DD HH:mm:ss'
export async function getAvailability(params) {
  const { data } = await api.get('/rooms/availability', { params });
  return data; // array ruangan + is_available
}

// params: { status?, page?, per_page? } -> paginator Laravel
export async function listBookings(params = {}) {
  const { data } = await api.get('/room-bookings', { params });
  return data;
}

export async function createBooking(payload) {
  const { data } = await api.post('/room-bookings', payload);
  return data;
}

export async function approveBooking(id) {
  const { data } = await api.post(`/room-bookings/${id}/approve`);
  return data;
}

export async function rejectBooking(id, reviewNote) {
  const { data } = await api.post(`/room-bookings/${id}/reject`, { review_note: reviewNote });
  return data;
}

// Respons 409 = draf notulen sudah berisi data; ulangi dengan { force: true } setelah konfirmasi.
export async function cancelBooking(id, { force = false } = {}) {
  await api.delete(`/room-bookings/${id}`, { params: force ? { force: 1 } : {} });
}