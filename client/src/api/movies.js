import { request } from './client';

// filters: { title, director, year, page } — empty values are ignored.
export function searchMovies(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return request(`/movies/search?${params}`);
}

export const getMovie = (tmdbId) => request(`/movies/${tmdbId}`);
