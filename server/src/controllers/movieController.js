import Movie from '../models/Movie.js';
import { searchMovies, getMovieDetails } from '../services/tmdb.js';

// GET /movies/search?title=&director=&year=&page=
export async function search(req, res) {
  const { title, director, year, page } = req.query;
  res.json(await searchMovies({ title, director, year, page }));
}

// Fetches the movie from TMDB and saves/updates the local copy.
export async function findOrCreateMovie(tmdbId) {
  const details = await getMovieDetails(tmdbId);
  return Movie.findOneAndUpdate({ tmdbId: details.tmdbId }, details, { upsert: true, returnDocument: 'after' });
}

// GET /movies/:tmdbId
export async function show(req, res) {
  const movie = await findOrCreateMovie(req.params.tmdbId);
  res.json({ movie });
}
