import mongoose from 'mongoose';

const diaryEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    watchedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

// Indexes user and watchedAt for chronological retrieval
diaryEntrySchema.index({ user: 1, watchedAt: -1 });

export default mongoose.model('DiaryEntry', diaryEntrySchema);
