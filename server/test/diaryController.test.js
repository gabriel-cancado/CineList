import assert from 'node:assert/strict';
import test from 'node:test';
import DiaryEntry from '../src/models/DiaryEntry.js';
import Movie from '../src/models/Movie.js';
import { add, checkMovie } from '../src/controllers/diaryController.js';

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

test('enforces one diary entry per user and movie with a unique index', () => {
  const hasUniqueUserMovieIndex = DiaryEntry.schema.indexes().some(([fields, options]) =>
    fields.user === 1 && fields.movie === 1 && options.unique === true,
  );

  assert.equal(hasUniqueUserMovieIndex, true);
});

test('returns the existing diary entry instead of creating a duplicate', async (t) => {
  const movie = { _id: 'movie-1' };
  const entry = { _id: 'entry-1', populate: async () => ({ _id: 'entry-1', movie }) };

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(DiaryEntry, 'findOne', async () => entry);
  t.mock.method(DiaryEntry, 'create', () => {
    throw new Error('A duplicate diary entry must not be created');
  });

  const response = createResponse();
  await add({ body: {}, params: { tmdbId: '42' }, user: { _id: 'user-1' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.entry._id, 'entry-1');
});

test('returns the winning diary entry when simultaneous requests conflict on the unique index', async (t) => {
  const movie = { _id: 'movie-1' };
  const populatedEntry = { _id: 'entry-1', movie };
  const existingEntry = { _id: 'entry-1', populate: async () => populatedEntry };
  const duplicateKeyError = Object.assign(new Error('Duplicate key'), { code: 11000 });
  let lookupCount = 0;

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(DiaryEntry, 'findOne', () => {
    lookupCount += 1;
    return Promise.resolve(lookupCount === 1 ? null : existingEntry);
  });
  t.mock.method(DiaryEntry, 'create', async () => { throw duplicateKeyError; });

  const response = createResponse();
  await add({ body: {}, params: { tmdbId: '42' }, user: { _id: 'user-1' } }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.entry._id, 'entry-1');
});

test('returns the diary entry ID and a binary watched count', async (t) => {
  const movie = { _id: 'movie-1' };
  const entry = { _id: 'entry-1' };

  t.mock.method(Movie, 'findOne', async () => movie);
  t.mock.method(DiaryEntry, 'findOne', async () => entry);

  const response = createResponse();
  await checkMovie({ params: { tmdbId: '42' }, user: { _id: 'user-1' } }, response);

  assert.deepEqual(response.body, { watched: true, count: 1, entryId: 'entry-1' });
});