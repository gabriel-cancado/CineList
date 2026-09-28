import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovie } from '../api/movies';
import { checkWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlist';
import { checkDiary, logMovie, removeDiaryEntry } from '../api/diary';
import { getMovieReviews, getMyMovieReview, saveMovieReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import styles from './MoviePage.module.css';

function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  return h ? `${h}h ${minutes % 60}min` : `${minutes}min`;
}

export default function MoviePage() {
  const { tmdbId } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [community, setCommunity] = useState({ averageRating: null, ratingsCount: 0, reviews: [] });
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchedCount, setWatchedCount] = useState(0);
  const [diaryEntryId, setDiaryEntryId] = useState(null);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [diarySubmitting, setDiarySubmitting] = useState(false);
  const [diaryError, setDiaryError] = useState('');
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [watchDate, setWatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [myReview, setMyReview] = useState(null);
  const [reviewRating, setReviewRating] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [communityError, setCommunityError] = useState('');

  useEffect(() => {
    setMovie(null);
    setError('');
    setCommunity({ averageRating: null, ratingsCount: 0, reviews: [] });
    setCommunityError('');
    setReviewError('');
    setDiaryError('');
    setMyReview(null);
    setReviewRating('');
    setReviewText('');
    setWatchDate(new Date().toISOString().slice(0, 10));
    setWatchedCount(0);
    setDiaryEntryId(null);
    setDiaryLoading(Boolean(user));

    getMovie(tmdbId)
      .then(({ movie: loadedMovie }) => {
        setMovie(loadedMovie);
        return getMovieReviews(tmdbId).then(setCommunity).catch((err) => setCommunityError(err.message));
      })
      .catch((err) => setError(err.message));

    if (user) {
      checkWatchlist(tmdbId).then((data) => setInWatchlist(data.inWatchlist)).catch(() => {});
      checkDiary(tmdbId)
        .then((data) => {
          setWatchedCount(data.count || 0);
          setDiaryEntryId(data.entryId || null);
        })
        .catch(() => {})
        .finally(() => setDiaryLoading(false));
      getMyMovieReview(tmdbId).then(({ review }) => {
        setMyReview(review);
        if (review) {
          setReviewRating(String(review.rating));
          setReviewText(review.text);
        }
      }).catch(() => {});
    } else {
      setInWatchlist(false);
      setWatchedCount(0);
      setDiaryEntryId(null);
      setDiaryLoading(false);
    }
  }, [tmdbId, user]);

  async function handleWatchlistToggle() {
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(tmdbId);
        setInWatchlist(false);
      } else {
        await addToWatchlist(tmdbId);
        setInWatchlist(true);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setWatchlistLoading(false);
    }
  }

  function openDiaryModal() {
    setWatchDate(new Date().toISOString().slice(0, 10));
    setReviewRating(myReview ? String(myReview.rating) : '');
    setReviewText(myReview?.text || '');
    setReviewError('');
    setCommunityError('');
    setShowDiaryModal(true);
  }

  async function handleDiaryToggle() {
    setDiaryError('');
    if (!user) {
      setDiaryError('Entre na sua conta para marcar o filme como assistido.');
      return;
    }
    if (watchedCount === 0) {
      openDiaryModal();
      return;
    }
    if (!diaryEntryId) {
      setDiaryError('Não foi possível localizar a entrada do diário. Atualize a página e tente novamente.');
      return;
    }

    setDiarySubmitting(true);
    try {
      await removeDiaryEntry(diaryEntryId);
      setWatchedCount(0);
      setDiaryEntryId(null);
    } catch (err) {
      setDiaryError(err.message);
    } finally {
      setDiarySubmitting(false);
    }
  }

  async function handleSaveDiary(e) {
    e.preventDefault();
    setReviewError('');
    setCommunityError('');
    if (reviewText.trim() && reviewRating === '') {
      setReviewError('Selecione uma nota para publicar a resenha.');
      return;
    }

    setReviewSubmitting(true);
    try {
      if (watchedCount === 0) {
        const { entry } = await logMovie(tmdbId, watchDate);
        setWatchedCount(1);
        setDiaryEntryId(entry._id);
      }

      if (reviewRating !== '') {
        const { review } = await saveMovieReview(tmdbId, Number(reviewRating), reviewText);
        setMyReview(review);
        try {
          setCommunity(await getMovieReviews(tmdbId));
        } catch (err) {
          setCommunityError(`Avaliação salva, mas não foi possível atualizar a comunidade: ${err.message}`);
        }
      }

      setShowDiaryModal(false);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!movie) return <div className="container"><p className={styles.loading}>Carregando…</p></div>;

  const details = [movie.year, formatRuntime(movie.runtime), movie.genres.join(', ')].filter(Boolean);
  const isAlreadyWatched = watchedCount > 0;

  return (
    <article>
      <div className={styles.backdrop} style={{ backgroundImage: movie.backdropUrl && `url(${movie.backdropUrl})` }} />

      <div className={`container ${styles.header}`}>
        {movie.posterUrl && <img className={styles.poster} src={movie.posterUrl} alt={movie.title} />}
        <div className={styles.info}>
          <h1>{movie.title}</h1>
          <p className={styles.details}>{details.join(' · ')}</p>
          {movie.directors.length > 0 && (
            <p className={styles.directors}>
              Direção de{' '}
              {movie.directors.map((name, i) => (
                <span key={name}>
                  {i > 0 && ', '}
                  <Link to={`/?by=director&q=${encodeURIComponent(name)}`}>{name}</Link>
                </span>
              ))}
            </p>
          )}

          <div className={styles.rating}>
            <span className={styles.star}>★</span>
            {community.ratingsCount ? (
              <><strong>{community.averageRating.toFixed(1)}</strong> <span>({community.ratingsCount} avaliações)</span></>
            ) : (
              <span>Ainda sem avaliações da comunidade</span>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${inWatchlist ? styles.active : ''}`}
              onClick={handleWatchlistToggle}
              disabled={watchlistLoading}
            >
              {inWatchlist ? '✓ Na sua lista' : '+ Quero assistir'}
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${watchedCount > 0 ? styles.active : ''}`}
              onClick={handleDiaryToggle}
              disabled={diaryLoading || diarySubmitting}
            >
              {diaryLoading ? 'Verificando…' : watchedCount > 0 ? '✓ Assistido' : '+ Marcar como assistido'}
            </button>
            {user && watchedCount > 0 && (
              <button type="button" className={styles.actionBtn} onClick={openDiaryModal} disabled={diarySubmitting}>
                Editar avaliação
              </button>
            )}
          </div>
          {diaryError && <p className="error" role="alert">{diaryError}</p>}

          <h2 className={styles.section}>Sinopse</h2>
          <p className={styles.overview}>{movie.overview || 'Sinopse não disponível.'}</p>
        </div>
      </div>

      <section className={`container ${styles.reviewsSection}`}>
        <div className={styles.communityReviews}>
          <h2 className={styles.section}>Resenhas da comunidade</h2>
          {communityError && <p className="error" role="alert">{communityError}</p>}
          {community.reviews.length ? community.reviews.map((review) => (
            <article className={styles.reviewItem} key={review._id}>
              <div className={styles.reviewByline}>
                <strong>{review.user.name}</strong>
                <span><span className={styles.star}>★</span> {review.rating}/5</span>
              </div>
              <p>{review.text}</p>
            </article>
          )) : (
            <p className={styles.reviewPrompt}>Ainda não há resenhas para este filme.</p>
          )}
        </div>
      </section>

      {showDiaryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDiaryModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{isAlreadyWatched ? 'Editar avaliação' : 'Registrar no Diário'}</h3>
            <p className={styles.modalSubtitle}>
              {isAlreadyWatched ? 'Atualize sua nota ou resenha deste filme.' : 'Quando você assistiu a este filme?'}
            </p>
            <form className={styles.modalReviewForm} onSubmit={handleSaveDiary}>
              {!isAlreadyWatched && (
                <>
                  <label className={styles.reviewLabel} htmlFor="watch-date">Data em que assistiu</label>
                  <input
                    id="watch-date"
                    type="date"
                    value={watchDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setWatchDate(e.target.value)}
                    required
                  />
                </>
              )}
              <fieldset className={styles.ratingFieldset}>
                <legend className={styles.reviewLabel}>Sua nota de 1 a 5 estrelas, com meias estrelas</legend>
                <div className={styles.ratingOptions}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rating = Number(reviewRating);
                    const fillClass = rating >= star
                      ? styles.filled
                      : rating >= star - 0.5 ? styles.halfFilled : '';
                    return (
                      <div className={`${styles.ratingStar} ${fillClass}`} key={star}>
                        <span className={styles.ratingSymbol} aria-hidden="true">★</span>
                        {[star - 0.5, star].map((value) => (
                          <label
                            className={`${styles.ratingHalfChoice} ${value < star ? styles.leftHalf : styles.rightHalf}`}
                            key={value}
                          >
                            <input
                              className={styles.ratingRadio}
                              type="radio"
                              name="review-rating"
                              value={value}
                              checked={reviewRating === String(value)}
                              onChange={(e) => setReviewRating(e.target.value)}
                              required={star === 1 && value === 0.5}
                            />
                            <span className={styles.srOnly}>{value} {value === 1 ? 'estrela' : 'estrelas'}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <label className={styles.reviewLabel} htmlFor="review-text">Resenha (opcional)</label>
              <textarea
                className={styles.reviewTextarea}
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="O que você achou do filme?"
              />
              <div className={styles.reviewSubmit}>
                <span className={styles.characterCount}>{reviewText.length}/2000</span>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowDiaryModal(false)}
                    disabled={reviewSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn"
                    type="submit"
                    disabled={reviewSubmitting || (isAlreadyWatched && reviewRating === '') || (reviewText.trim() !== '' && reviewRating === '')}
                  >
                    {reviewSubmitting
                      ? 'Salvando…'
                      : isAlreadyWatched
                        ? 'Salvar avaliação'
                        : reviewRating === '' ? 'Marcar como assistido' : 'Registrar e avaliar'}
                  </button>
                </div>
              </div>
              {reviewText.trim() !== '' && reviewRating === '' && (
                <p className="error" role="alert">Selecione uma nota para publicar a resenha.</p>
              )}
              {reviewError && <p className="error" role="alert">{reviewError}</p>}
            </form>
          </div>
        </div>
      )}

      {movie.cast.length > 0 && (
        <section className="container">
          <h2 className={styles.section}>Elenco</h2>
          <div className={styles.cast}>
            {movie.cast.map((person) => (
              <div key={person.name + person.character} className={styles.person}>
                {person.photoUrl ? <img src={person.photoUrl} alt={person.name} loading="lazy" />
                  : <div className={styles.noPhoto}>{person.name[0]}</div>}
                <strong>{person.name}</strong>
                <span>{person.character}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
