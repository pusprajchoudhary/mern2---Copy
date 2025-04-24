const API = import.meta.env.VITE_API || 'http://localhost:5000';

export const login = async (credentials) => {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return await res.json();
};

export const register = async (userData) => {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await res.json();
};
