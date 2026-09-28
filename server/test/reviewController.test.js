import assert from 'node:assert/strict';
import test from 'node:test';
import DiaryEntry from '../src/models/DiaryEntry.js';
import Movie from '../src/models/Movie.js';
import MovieReview from '../src/models/MovieReview.js';
import { list, save } from '../src/controllers/reviewController.js';

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

test('rejects ratings outside the integer range from 0 to 5', async () => {
  const response = createResponse();

  await assert.rejects(
    save(createSaveRequest({ rating: 5.5 }), response),
    (error) => error.status === 400,
  );
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