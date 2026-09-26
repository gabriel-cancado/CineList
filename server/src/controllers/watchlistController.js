import Watchlist from '../models/Watchlist.js';
import Movie from '../models/Movie.js';
import { findOrCreateMovie } from './movieController.js';

// GET /watchlist
export async function list(req, res) {
  const items = await Watchlist.find({ user: req.user._id })
    .populate('movie')
    .sort({ createdAt: -1 });
  res.json({ items: items.map((item) => item.movie) });
}

// GET /watchlist/check/:tmdbId
export async function check(req, res) {
  const movie = await Movie.findOne({ tmdbId: req.params.tmdbId });
  if (!movie) return res.json({ inWatchlist: false });

  const item = await Watchlist.findOne({ user: req.user._id, movie: movie._id });
  res.json({ inWatchlist: Boolean(item) });
}

// POST /watchlist/:tmdbId
export async function add(req, res) {
  const movie = await findOrCreateMovie(req.params.tmdbId);
  await Watchlist.findOneAndUpdate(
    { user: req.user._id, movie: movie._id },
    { user: req.user._id, movie: movie._id },
    { upsert: true, returnDocument: 'after' },
  );
  res.status(201).json({ inWatchlist: true });
}

// DELETE /watchlist/:tmdbId
export async function remove(req, res) {
  const movie = await Movie.findOne({ tmdbId: req.params.tmdbId });
  if (movie) {
    await Watchlist.deleteOne({ user: req.user._id, movie: movie._id });
  }
  res.json({ inWatchlist: false });
}
