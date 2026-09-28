import { request } from './client';

export const getMovieReviews = (tmdbId) => request(`/reviews/${tmdbId}`);
export const getMyMovieReview = (tmdbId) => request(`/reviews/${tmdbId}/mine`);
export const saveMovieReview = (tmdbId, rating, text) =>
  request(`/reviews/${tmdbId}`, { method: 'PUT', body: { rating, text } });