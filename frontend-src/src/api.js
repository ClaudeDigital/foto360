const BASE = '/api';

function getToken() {
  return localStorage.getItem('foto360_token');
}
function getAdminToken() {
  return localStorage.getItem('foto360_admin_token');
}

async function request(url, { method = 'GET', body, admin = false, isForm = false } = {}) {
  const headers = {};
  const token = admin ? getAdminToken() : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = body;
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Diçka shkoi keq');
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  createOrder: (body) => request('/orders', { method: 'POST', body }),
  myOrders: () => request('/orders/mine'),
  locations: () => request('/locations'),
  createLocation: (body) => request('/locations', { method: 'POST', body }),
  getLocation: (id) => request(`/locations/${id}`),
  deleteLocation: (id) => request(`/locations/${id}`, { method: 'DELETE' }),
  photos: (id, params = '') => request(`/locations/${id}/photos${params}`),
  uploadPhoto: (id, formData) => request(`/locations/${id}/photos`, { method: 'POST', body: formData, isForm: true }),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),
  createTimelapse: (id, body) => request(`/locations/${id}/timelapse`, { method: 'POST', body }),
  timelapses: (id) => request(`/locations/${id}/timelapses`),
  timelapse: (id) => request(`/timelapses/${id}`),
  pushKey: () => request('/push/key'),
  pushSubscribe: (sub) => request('/push/subscribe', { method: 'POST', body: sub }),
  pushUnsubscribe: (endpoint) => request('/push/unsubscribe', { method: 'POST', body: { endpoint } }),
  pushTest: () => request('/push/test', { method: 'POST' }),

  adminLogin: (body) => request('/admin/login', { method: 'POST', body, admin: true }),
  adminMe: () => request('/admin/me', { admin: true }),
  adminStats: () => request('/admin/stats', { admin: true }),
  adminUsers: () => request('/admin/users', { admin: true }),
  adminOrders: (status) => request(`/admin/orders${status ? `?status=${status}` : ''}`, { admin: true }),
  adminDecide: (id, decision) => request(`/admin/orders/${id}`, { method: 'PUT', body: { decision }, admin: true })
};

export { getToken, getAdminToken };

// Photos are served statically; thumbnails are generated on demand by the server.
export const photoUrl = (filename) => `/uploads/photos/${filename}`;
export const thumbUrl = (filename) => `/uploads/thumbs/${filename}`;
