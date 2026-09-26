import { request } from './client';

export const getWatchlist = () => request('/watchlist');
export const checkWatchlist = (tmdbId) => request(`/watchlist/check/${tmdbId}`);
export const addToWatchlist = (tmdbId) => request(`/watchlist/${tmdbId}`, { method: 'POST' });
export const removeFromWatchlist = (tmdbId) => request(`/watchlist/${tmdbId}`, { method: 'DELETE' });
