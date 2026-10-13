/**
 * API service — centralizes all HTTP calls to the Express backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, options);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to backend. Is the server running on port 5000?');
    }
    throw err;
  }
}

// ─── Health ───
export async function checkHealth() {
  return request('/health');
}

// ─── Dashboard ───
export async function getDashboard() {
  return request('/dashboard');
}

// ─── Properties ───
export async function listProperties() {
  return request('/properties');
}

export async function getProperty(id) {
  return request(`/properties/${encodeURIComponent(id)}`);
}

// ─── Register ───
export async function registerProperty(propertyId, owner, file) {
  const formData = new FormData();
  formData.append('propertyId', propertyId);
  formData.append('owner', owner);
  formData.append('document', file);
  return request('/properties/register', { method: 'POST', body: formData });
}

// ─── Verify ───
export async function verifyDocument(propertyId, file) {
  const formData = new FormData();
  formData.append('propertyId', propertyId);
  formData.append('document', file);
  return request('/properties/verify', { method: 'POST', body: formData });
}

// ─── Transfer ───
export async function transferOwnership(propertyId, currentOwner, newOwner, file) {
  const formData = new FormData();
  formData.append('propertyId', propertyId);
  formData.append('currentOwner', currentOwner);
  formData.append('newOwner', newOwner);
  formData.append('document', file);
  return request('/properties/transfer', { method: 'POST', body: formData });
}

// ─── History ───
export async function getOwnershipHistory(propertyId) {
  return request(`/properties/${encodeURIComponent(propertyId)}/history`);
}

// ─── Transactions ───
export async function getTransactions() {
  return request('/transactions');
}

// ─── Sample Documents ───
export async function getSampleDocs() {
  return request('/sample-docs');
}

export async function fetchSampleDocBlob(filename) {
  const res = await fetch(`${API_BASE}/sample-docs/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error('Failed to load sample document');
  return res.blob();
}

// ─── Seed Demo Records ───
export async function seedDemoRecords() {
  return request('/seed', { method: 'POST' });
}


