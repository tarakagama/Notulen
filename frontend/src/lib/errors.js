// Backend: 422 { message, errors: { field: [..] } }, 403/409 { message }.
export function extractError(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
  const data = err?.response?.data;

  if (data?.errors) {
    const messages = Object.values(data.errors).flat();
    if (messages.length) return messages.join(' ');
  }

  return data?.message || fallback;
}