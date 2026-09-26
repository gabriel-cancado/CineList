import { request } from './client';

export const getDiary = () => request('/diary');
export const checkDiary = (tmdbId) => request(`/diary/check/${tmdbId}`);
export const logMovie = (tmdbId, watchedAt) => request(`/diary/${tmdbId}`, { method: 'POST', body: { watchedAt } });
export const removeDiaryEntry = (id) => request(`/diary/${id}`, { method: 'DELETE' });
