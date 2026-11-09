const API_ROOT = 'backend/api';

export async function api(path, options = {}) {
  const response = await fetch(`${API_ROOT}/${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({ success: false, error: 'Invalid server response.' }));
  if (!response.ok || payload.success === false) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
export const put = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body) });
export const remove = (path) => api(path, { method: 'DELETE' });
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character]));
