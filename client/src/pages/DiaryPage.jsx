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
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getDiary()
      .then((data) => setEntries(data.entries || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function confirmDelete() {
    if (!entryToDelete) return;
    setDeleting(true);
    try {
      await removeDiaryEntry(entryToDelete._id);
      setEntries((prev) => prev.filter((entry) => entry._id !== entryToDelete._id));
      setEntryToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
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
                    onClick={() => setEntryToDelete(entry)}
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

      {entryToDelete && (
        <div className={styles.modalOverlay} onClick={() => setEntryToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Remover do Diário</h3>
            <p className={styles.modalText}>
              Tem certeza que deseja remover <strong>{entryToDelete.movie.title}</strong> do seu diário?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEntryToDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
