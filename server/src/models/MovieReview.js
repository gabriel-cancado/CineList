import mongoose from 'mongoose';

const movieReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: (value) => Number.isInteger(value * 2),
        message: 'A nota deve usar incrementos de meia estrela',
      },
    },
    text: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true },
);

movieReviewSchema.index({ user: 1, movie: 1 }, { unique: true });
movieReviewSchema.index({ movie: 1, updatedAt: -1 });

export default mongoose.model('MovieReview', movieReviewSchema);