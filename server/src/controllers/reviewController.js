import DiaryEntry from '../models/DiaryEntry.js';
import Movie from '../models/Movie.js';
import MovieReview from '../models/MovieReview.js';
import { HttpError } from '../middleware/errorHandler.js';

async function findMovie(tmdbId) {
  const numericId = Number(tmdbId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new HttpError(400, 'ID do filme inválido');
  }
  return Movie.findOne({ tmdbId: numericId });
}

// GET /reviews/:tmdbId
export async function list(req, res) {
  const movie = await findMovie(req.params.tmdbId);
  if (!movie) return res.json({ averageRating: null, ratingsCount: 0, reviews: [] });

  const [summary, reviews] = await Promise.all([
    MovieReview.aggregate([
      { $match: { movie: movie._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, ratingsCount: { $sum: 1 } } },
    ]),
    MovieReview.find({ movie: movie._id, text: { $ne: '' } })
      .populate('user', 'name')
      .sort({ updatedAt: -1 })
      .limit(50),
  ]);

  const { averageRating = null, ratingsCount = 0 } = summary[0] || {};
  res.json({
    averageRating: averageRating === null ? null : Math.round(averageRating * 10) / 10,
    ratingsCount,
    reviews,
  });
}

// GET /reviews/:tmdbId/mine
export async function mine(req, res) {
  const movie = await findMovie(req.params.tmdbId);
  if (!movie) return res.json({ review: null });

  const review = await MovieReview.findOne({ user: req.user._id, movie: movie._id });
  res.json({ review });
}

// PUT /reviews/:tmdbId
export async function save(req, res) {
  const rating = req.body.rating;
  const text = req.body.text ?? '';

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 0 || rating > 5) {
    throw new HttpError(400, 'A nota deve ser um número inteiro entre 0 e 5');
  }
  if (typeof text !== 'string' || text.length > 2000) {
    throw new HttpError(400, 'A resenha deve ter no máximo 2000 caracteres');
  }

  const movie = await findMovie(req.params.tmdbId);
  if (!movie) throw new HttpError(404, 'Filme não encontrado');

  const existingReview = await MovieReview.findOne({ user: req.user._id, movie: movie._id });
  const watched = await DiaryEntry.exists({ user: req.user._id, movie: movie._id });
  if (!watched && !existingReview) {
    throw new HttpError(400, 'Marque o filme como assistido antes de avaliá-lo');
  }

  const reviewFilter = { user: req.user._id, movie: movie._id };
  let review;
  try {
    review = await MovieReview.findOneAndUpdate(
      reviewFilter,
      { $set: { rating, text } },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    ).populate('user', 'name');
  } catch (error) {
    if (error.code !== 11000) throw error;

    review = await MovieReview.findOne(reviewFilter).populate('user', 'name');
    if (!review) throw error;
  }

  res.json({ review });
}