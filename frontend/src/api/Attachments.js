import api from './client';

export async function uploadAttachment(meetingId, file, fileType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);

  const { data } = await api.post(`/meetings/${meetingId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteAttachment(meetingId, attachmentId) {
  await api.delete(`/meetings/${meetingId}/attachments/${attachmentId}`);
}