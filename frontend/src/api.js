export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql';

export async function rest(path, method = 'GET', payload, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const raw = await res.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    const error = new Error(message || `Error HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function gql(query, variables = {}, token) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (!res.ok || data.errors?.length) {
    throw new Error(data.errors?.map(e => e.message).join('; ') || `GraphQL HTTP ${res.status}`);
  }
  return data.data;
}
