import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovie } from '../api/movies';
import { checkWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlist';
import { checkDiary, logMovie } from '../api/diary';
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
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [watchDate, setWatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [diarySubmitting, setDiarySubmitting] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [reviewRating, setReviewRating] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [communityError, setCommunityError] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  useEffect(() => {
    setMovie(null);
    setError('');
    setCommunity({ averageRating: null, ratingsCount: 0, reviews: [] });
    setCommunityError('');
    setReviewError('');
    setMyReview(null);
    setReviewRating('');
    setReviewText('');
    setReviewSaved(false);

    getMovie(tmdbId)
      .then(({ movie: loadedMovie }) => {
        setMovie(loadedMovie);
        return getMovieReviews(tmdbId).then(setCommunity).catch((err) => setCommunityError(err.message));
      })
      .catch((err) => setError(err.message));

    if (user) {
      checkWatchlist(tmdbId).then((data) => setInWatchlist(data.inWatchlist)).catch(() => {});
      checkDiary(tmdbId).then((data) => setWatchedCount(data.count || 0)).catch(() => {});
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

  async function handleSaveDiary(e) {
    e.preventDefault();
    setDiarySubmitting(true);
    try {
      await logMovie(tmdbId, watchDate);
      setWatchedCount((prev) => prev + 1);
      setShowDiaryModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDiarySubmitting(false);
    }
  }

  async function handleSaveReview(e) {
    e.preventDefault();
    setReviewError('');
    setCommunityError('');
    setReviewSaved(false);
    setReviewSubmitting(true);
    try {
      const { review } = await saveMovieReview(tmdbId, Number(reviewRating), reviewText);
      setMyReview(review);
      setReviewSaved(true);
      try {
        setCommunity(await getMovieReviews(tmdbId));
      } catch (err) {
        setCommunityError(`Avaliação salva, mas não foi possível atualizar a comunidade: ${err.message}`);
      }
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!movie) return <div className="container"><p className={styles.loading}>Carregando…</p></div>;

  const details = [movie.year, formatRuntime(movie.runtime), movie.genres.join(', ')].filter(Boolean);

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
              onClick={() => setShowDiaryModal(true)}
            >
              {watchedCount > 0 ? `✓ Assistido (${watchedCount})` : '+ Marcar como assistido'}
            </button>
          </div>

          <h2 className={styles.section}>Sinopse</h2>
          <p className={styles.overview}>{movie.overview || 'Sinopse não disponível.'}</p>
        </div>
      </div>

      <section className={`container ${styles.reviewsSection}`}>
        <h2 className={styles.section}>Avaliações e resenhas</h2>
        {user ? (
          watchedCount > 0 || myReview ? (
            <form className={styles.reviewForm} onSubmit={handleSaveReview}>
              <label className={styles.reviewLabel} htmlFor="review-rating">Sua nota</label>
              <select
                id="review-rating"
                value={reviewRating}
                onChange={(e) => setReviewRating(e.target.value)}
                required
              >
                <option value="" disabled>Selecione de 0 a 5 estrelas</option>
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value} {value === 1 ? 'estrela' : 'estrelas'}</option>
                ))}
              </select>
              <label className={styles.reviewLabel} htmlFor="review-text">Resenha (opcional)</label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="O que você achou do filme?"
              />
              <div className={styles.reviewSubmit}>
                <span className={styles.characterCount}>{reviewText.length}/2000</span>
                <button className="btn" type="submit" disabled={reviewSubmitting || reviewRating === ''}>
                  {reviewSubmitting ? 'Salvando…' : myReview ? 'Atualizar avaliação' : 'Publicar avaliação'}
                </button>
              </div>
              {reviewError && <p className="error" role="alert">{reviewError}</p>}
              {reviewSaved && <p className={styles.savedMessage} role="status">Avaliação salva.</p>}
            </form>
          ) : (
            <p className={styles.reviewPrompt}>Marque o filme como assistido no diário para avaliá-lo.</p>
          )
        ) : (
          <p className={styles.reviewPrompt}>Entre na sua conta e marque o filme como assistido para avaliá-lo. <Link to="/login">Entrar</Link></p>
        )}

        <div className={styles.communityReviews}>
          <h3>Resenhas da comunidade</h3>
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
            <h3>Registrar no Diário</h3>
            <p className={styles.modalSubtitle}>Quando você assistiu a este filme?</p>
            <form onSubmit={handleSaveDiary}>
              <input
                type="date"
                value={watchDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setWatchDate(e.target.value)}
                required
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowDiaryModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn" disabled={diarySubmitting}>
                  {diarySubmitting ? 'Salvando…' : 'Salvar no diário'}
                </button>
              </div>
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
