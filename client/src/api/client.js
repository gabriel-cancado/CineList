const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Wrapper around fetch: sends the JWT when logged in and throws the backend error message.
export async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao comunicar com o servidor');
  return data;
}
