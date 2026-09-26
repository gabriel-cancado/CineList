import { request } from './client';

export const registerUser = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: { name, email, password } });

export const loginUser = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password } });

export const fetchMe = () => request('/auth/me');
