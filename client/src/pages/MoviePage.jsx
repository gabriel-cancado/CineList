import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovie } from '../api/movies';
import { checkWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlist';
import styles from './MoviePage.module.css';

function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  return h ? `${h}h ${minutes % 60}min` : `${minutes}min`;
}

export default function MoviePage() {
  const { tmdbId } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    setMovie(null);
    setError('');
    getMovie(tmdbId).then((data) => setMovie(data.movie)).catch((err) => setError(err.message));
    checkWatchlist(tmdbId).then((data) => setInWatchlist(data.inWatchlist)).catch(() => {});
  }, [tmdbId]);

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

          {/* Community average: filled in once ratings (story 4) send averageRating/ratingsCount. */}
          <div className={styles.rating}>
            <span className={styles.star}>★</span>
            {movie.ratingsCount ? (
              <><strong>{movie.averageRating.toFixed(1)}</strong> <span>({movie.ratingsCount} avaliações)</span></>
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
          </div>

          <h2 className={styles.section}>Sinopse</h2>
          <p className={styles.overview}>{movie.overview || 'Sinopse não disponível.'}</p>
        </div>
      </div>

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
