import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist } from '../api/watchlist';
import MovieCard from '../components/MovieCard';
import styles from './WatchlistPage.module.css';

export default function WatchlistPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getWatchlist()
      .then((data) => setMovies(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
            <MovieCard key={movie._id || movie.tmdbId} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
