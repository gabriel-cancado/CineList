import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist } from '../api/watchlist';
import MovieCard from '../components/MovieCard';
import styles from './WatchlistPage.module.css';

export default function WatchlistPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movieToRemove, setMovieToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    getWatchlist()
      .then((data) => setMovies(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function confirmRemove() {
    if (!movieToRemove) return;
    setRemoving(true);
    try {
      await removeFromWatchlist(movieToRemove.tmdbId);
      setMovies((prev) => prev.filter((m) => (m._id || m.tmdbId) !== (movieToRemove._id || movieToRemove.tmdbId)));
      setMovieToRemove(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Quero Assistir</h1>
        <p className={styles.subtitle}>
          {movies.length} {movies.length === 1 ? 'filme salvo' : 'filmes salvos'} para ver depois
        </p>
      </header>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className={styles.empty}>Carregando sua lista…</p>
      ) : movies.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Sua lista de desejos está vazia.</p>
          <Link to="/" className="btn">Explorar filmes</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {movies.map((movie) => (
            <div key={movie._id || movie.tmdbId} className={styles.cardWrapper}>
              <MovieCard movie={movie} />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setMovieToRemove(movie)}
                title="Remover da lista"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {movieToRemove && (
        <div className={styles.modalOverlay} onClick={() => setMovieToRemove(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Remover da Lista</h3>
            <p className={styles.modalText}>
              Tem certeza que deseja remover <strong>{movieToRemove.title}</strong> de "Quero Assistir"?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setMovieToRemove(null)}
                disabled={removing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={confirmRemove}
                disabled={removing}
              >
                {removing ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
