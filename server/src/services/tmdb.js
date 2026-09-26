// Thin client for the TMDB API (https://developer.themoviedb.org/docs).
// The API key stays on the server; the frontend only talks to our own routes.
import { HttpError } from '../middleware/errorHandler.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p';

async function tmdbFetch(path, params = {}) {
  const query = new URLSearchParams({ api_key: process.env.TMDB_API_KEY, language: 'pt-BR' });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, value);
  }
  const res = await fetch(`${BASE_URL}${path}?${query}`);
  if (res.status === 404) throw new HttpError(404, 'Movie not found');
  if (!res.ok) throw new HttpError(502, 'Failed to reach TMDB');
  return res.json();
}

function imageUrl(path, size = 'w500') {
  return path ? `${IMAGE_URL}/${size}${path}` : null;
}

function toSummary(movie) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
    posterUrl: imageUrl(movie.poster_path),
  };
}

// Search by title, director or year (any combination; director takes precedence over title).
export async function searchMovies({ title, director, year, page = 1 }) {
  let data;
  if (director) {
    const people = await tmdbFetch('/search/person', { query: director });
    const person = people.results[0];
    if (!person) return { page: 1, totalPages: 0, results: [] };
    data = await tmdbFetch('/discover/movie', {
      with_crew: person.id, primary_release_year: year, sort_by: 'popularity.desc', page,
    });
  } else if (title) {
    data = await tmdbFetch('/search/movie', { query: title, primary_release_year: year, page });
  } else if (year) {
    // vote_count filter hides obscure entries that would otherwise top the popularity list.
    data = await tmdbFetch('/discover/movie', {
      primary_release_year: year, sort_by: 'popularity.desc', 'vote_count.gte': 100, page,
    });
  } else {
    data = await tmdbFetch('/movie/popular', { page });
  }
  return { page: data.page, totalPages: data.total_pages, results: data.results.map(toSummary) };
}

// Full movie sheet: synopsis, runtime, directors and main cast.
export async function getMovieDetails(tmdbId) {
  const movie = await tmdbFetch(`/movie/${tmdbId}`, { append_to_response: 'credits' });
  return {
    ...toSummary(movie),
    overview: movie.overview,
    runtime: movie.runtime,
    genres: movie.genres.map((g) => g.name),
    backdropUrl: imageUrl(movie.backdrop_path, 'w1280'),
    directors: movie.credits.crew.filter((c) => c.job === 'Director').map((c) => c.name),
    cast: movie.credits.cast.slice(0, 12).map((c) => ({
      name: c.name,
      character: c.character,
      photoUrl: imageUrl(c.profile_path, 'w185'),
    })),
  };
}
