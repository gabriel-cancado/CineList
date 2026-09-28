import DiaryEntry from '../models/DiaryEntry.js';
import Movie from '../models/Movie.js';
import { findOrCreateMovie } from './movieController.js';

// GET /diary
export async function list(req, res) {
  const entries = await DiaryEntry.find({ user: req.user._id })
    .populate('movie')
    .sort({ watchedAt: -1, createdAt: -1 });
  res.json({ entries });
}

// GET /diary/check/:tmdbId
export async function checkMovie(req, res) {
  const movie = await Movie.findOne({ tmdbId: req.params.tmdbId });
  if (!movie) return res.json({ watched: false, count: 0 });

  const entry = await DiaryEntry.findOne({ user: req.user._id, movie: movie._id });
  res.json({ watched: Boolean(entry), count: entry ? 1 : 0, entryId: entry?._id ?? null });
}

// POST /diary/:tmdbId
export async function add(req, res) {
  const movie = await Movie.findOne({ tmdbId: req.params.tmdbId })
    || await findOrCreateMovie(req.params.tmdbId);
  const watchedAt = req.body.watchedAt ? new Date(req.body.watchedAt) : new Date();
  const filter = { user: req.user._id, movie: movie._id };
  const existing = await DiaryEntry.findOne(filter);
  if (existing) {
    return res.json({ entry: await existing.populate('movie') });
  }

  let entry;
  try {
    entry = await DiaryEntry.create({ ...filter, watchedAt });
  } catch (error) {
    if (error.code !== 11000) throw error;
    entry = await DiaryEntry.findOne(filter);
    if (!entry) throw error;
  }

  const populated = await entry.populate('movie');
  res.status(201).json({ entry: populated });
}

// DELETE /diary/:id
export async function remove(req, res) {
  await DiaryEntry.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ status: 'ok' });
}
