import mongoose from 'mongoose';

// Local copy of a TMDB movie. Ratings, reviews, diary and watchlist point to this document.
const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    year: Number,
    posterUrl: String,
    backdropUrl: String,
    overview: String,
    runtime: Number,
    genres: [String],
    directors: [String],
    cast: [{ _id: false, name: String, character: String, photoUrl: String }],
  },
  { timestamps: true },
);

export default mongoose.model('Movie', movieSchema);
