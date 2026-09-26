import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDiary, removeDiaryEntry } from '../api/diary';
import styles from './DiaryPage.module.css';

function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function DiaryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDiary()
      .then((data) => setEntries(data.entries || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(id) {
    if (!window.confirm('Remover esta entrada do diário?')) return;
    try {
      await removeDiaryEntry(id);
      setEntries((prev) => prev.filter((entry) => entry._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Diário de Filmes</h1>
        <p className={styles.subtitle}>
          {entries.length} {entries.length === 1 ? 'filme assistido' : 'filmes assistidos'} registrados
        </p>
      </header>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className={styles.empty}>Carregando diário…</p>
      ) : entries.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Você ainda não registrou nenhum filme no seu diário.</p>
          <Link to="/" className="btn">Buscar filmes</Link>
        </div>
      ) : (
        <div className={styles.timeline}>
          {entries.map((entry) => (
            <div key={entry._id} className={styles.entryCard}>
              <Link to={`/movies/${entry.movie.tmdbId}`} className={styles.posterLink}>
                {entry.movie.posterUrl ? (
                  <img src={entry.movie.posterUrl} alt={entry.movie.title} />
                ) : (
                  <div className={styles.noPoster}>{entry.movie.title[0]}</div>
                )}
              </Link>
              <div className={styles.info}>
                <div className={styles.metaRow}>
                  <time className={styles.date}>{formatDate(entry.watchedAt)}</time>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleRemove(entry._id)}
                    title="Remover do diário"
                  >
                    ×
                  </button>
                </div>
                <Link to={`/movies/${entry.movie.tmdbId}`} className={styles.movieTitle}>
                  <h2>{entry.movie.title}</h2>
                </Link>
                <p className={styles.movieMeta}>
                  {entry.movie.year}
                  {entry.movie.directors?.length > 0 && ` · ${entry.movie.directors.join(', ')}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
