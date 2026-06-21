import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Makes an authenticated request to the EcoMind backend, attaching the
 * current Supabase session's access token so the backend can verify
 * who's calling.
 */
async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return body;
}

export function calculateFootprint(input) {
  return apiFetch('/api/footprint/calculate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function saveFootprint(input) {
  return apiFetch('/api/footprint/save', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export function getFootprintHistory() {
  return apiFetch('/api/footprint/history', { method: 'GET' });
}
