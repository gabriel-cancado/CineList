import assert from 'node:assert/strict';
import test from 'node:test';
import DiaryEntry from '../src/models/DiaryEntry.js';
import Movie from '../src/models/Movie.js';
import MovieReview from '../src/models/MovieReview.js';
import { list, mine, save } from '../src/controllers/reviewController.js';

function createResponse() {
  return {
    body: null,
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createSaveRequest({ rating = 4, text = '' } = {}) {
  return {
    body: { rating, text },
    params: { tmdbId: '42' },
    user: { _id: 'user-1' },
  };
}

test('rejects invalid TMDB IDs in all review endpoints', async () => {
  const endpoints = [
    [list, { params: { tmdbId: 'not-a-number' } }],
    [mine, { params: { tmdbId: '0' }, user: { _id: 'user-1' } }],
    [save, { ...createSaveRequest(), params: { tmdbId: '42.5' } }],
  ];

  for (const [handler, request] of endpoints) {
    await assert.rejects(
      handler(request, createResponse()),
      (error) => error.status === 400,
    );
  }
});

test('rejects zero, fractions smaller than half a star, and ratings above five', async () => {
  for (const rating of [0, 0.25, 5.5]) {
    await assert.rejects(
      save(createSaveRequest({ rating }), createResponse()),
      (error) => error.status === 400,
    );
  }
});

test('accepts and saves a half-star rating', async (t) => {
  const movie = { _id: 'movie-1' };
  const review = { _id: 'review-1', rating: 4.5, text: '' };
  let update;

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(DiaryEntry, 'exists', async () => ({ _id: 'entry-1' }));
  t.mock.method(MovieReview, 'findOneAndUpdate', (filter, changes) => {
    update = { filter, changes };
    return { populate: async () => review };
  });

  const response = createResponse();
  await save(createSaveRequest({ rating: 4.5 }), response);

  assert.equal(update.changes.$set.rating, 4.5);
  assert.equal(response.body.review.rating, 4.5);
});

test('rejects review text longer than 2000 characters', async () => {
  const response = createResponse();

  await assert.rejects(
    save(createSaveRequest({ text: 'a'.repeat(2001) }), response),
    (error) => error.status === 400,
  );
});

test('requires the user to have watched the movie before the first rating', async (t) => {
  const movie = { _id: 'movie-1' };
  let saved = false;

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(MovieReview, 'findOne', async () => null);
  t.mock.method(DiaryEntry, 'exists', async () => null);
  t.mock.method(MovieReview, 'findOneAndUpdate', () => {
    saved = true;
    throw new Error('The review must not be saved');
  });

  await assert.rejects(
    save(createSaveRequest(), createResponse()),
    (error) => error.status === 400,
  );
  assert.equal(saved, false);
});

test('requires the movie to remain in the diary before updating an existing review', async (t) => {
  t.mock.method(Movie, 'findOne', async () => ({ _id: 'movie-1' }));
  t.mock.method(DiaryEntry, 'exists', async () => null);

  await assert.rejects(
    save(createSaveRequest(), createResponse()),
    (error) => error.status === 400,
  );
});

test('returns the rating created by a concurrent request after a duplicate-key conflict', async (t) => {
  const movie = { _id: 'movie-1' };
  const concurrentReview = { _id: 'review-1', rating: 4, text: '' };
  const duplicateKeyError = Object.assign(new Error('Duplicate key'), { code: 11000 });

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(MovieReview, 'findOne', () => ({ populate: async () => concurrentReview }));
  t.mock.method(DiaryEntry, 'exists', async () => ({ _id: 'entry-1' }));
  t.mock.method(MovieReview, 'findOneAndUpdate', () => ({
    populate: async () => { throw duplicateKeyError; },
  }));

  const response = createResponse();
  await save(createSaveRequest(), response);

  assert.equal(response.body.review, concurrentReview);
});

test('returns the community average and public text reviews', async (t) => {
  const movie = { _id: 'movie-1' };
  const reviews = [{ rating: 4, text: 'Gostei do filme.' }];
  const query = {
    populate() { return this; },
    sort() { return this; },
    limit() { return Promise.resolve(reviews); },
  };

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(MovieReview, 'aggregate', async () => [{ averageRating: 4.26, ratingsCount: 3 }]);
  t.mock.method(MovieReview, 'find', () => query);

  const response = createResponse();
  await list({ params: { tmdbId: '42' } }, response);

  assert.equal(response.body.averageRating, 4.3);
  assert.equal(response.body.ratingsCount, 3);
  assert.deepEqual(response.body.reviews, reviews);
});