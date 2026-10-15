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

// ── Kelola master ruangan (pengelola ruangan / SuperAdmin) ───────────────

// Semua ruangan termasuk nonaktif, dengan upcoming_bookings_count per ruangan.
export async function listManageableRooms() {
  const { data } = await api.get('/rooms', { params: { include_inactive: 1 } });
  return data;
}

// payload: { room_name, building, floor, capacity, facilities: string[], is_active }
export async function createRoom(payload) {
  const { data } = await api.post('/rooms', payload);
  return data;
}

export async function updateRoom(id, payload) {
  const { data } = await api.put(`/rooms/${id}`, payload);
  return data;
}

// 422 kalau ruangan sudah punya riwayat booking (nonaktifkan saja).
export async function deleteRoom(id) {
  await api.delete(`/rooms/${id}`);
}

// Ketersediaan semua ruangan aktif untuk hari ini (kartu Dashboard):
// { now, open_time, close_time, is_open, rooms: [{ ..., status: available|in_use|closed, busy_until, next_start }] }
export async function getRoomsToday() {
  const { data } = await api.get('/rooms/today');
  return data;
}

// Jam operasional booking: { open_time: '08:00', close_time: '18:00' }
export async function getBookingSettings() {
  const { data } = await api.get('/booking-settings');
  return data;
}