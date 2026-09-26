import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMovies } from '../api/movies';
import MovieCard from '../components/MovieCard';
import styles from './SearchPage.module.css';

const MODES = { title: 'Título', director: 'Diretor', year: 'Ano' };

// Filters live in the URL (?by=&q=&year=) so "back" from a movie page restores the search.
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const by = params.get('by') || 'title';
  const q = params.get('q') || '';
  const year = params.get('year') || '';

  const [form, setForm] = useState({ by, q, year });
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(pageToLoad) {
    setLoading(true);
    setError('');
    const filters = by === 'year' ? { year: q } : { [by]: q, year };
    try {
      const data = await searchMovies({ ...filters, page: pageToLoad });
      setMovies((prev) => (pageToLoad === 1 ? data.results : [...prev, ...data.results]));
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm({ by, q, year });
    load(1);
  }, [by, q, year]);

  function handleSubmit(e) {
    e.preventDefault();
    const next = { by: form.by, q: form.q.trim() };
    if (form.by !== 'year' && form.year) next.year = form.year;
    setParams(next.q ? next : {});
  }

  return (
    <div className="container">
      <section className={styles.hero}>
        <h1>O que vamos assistir hoje?</h1>
        <form className={styles.search} onSubmit={handleSubmit}>
          <div className={styles.modes}>
            {Object.entries(MODES).map(([key, label]) => (
              <button type="button" key={key} onClick={() => setForm({ ...form, by: key })}
                className={form.by === key ? styles.active : ''}>{label}</button>
            ))}
          </div>
          <div className={styles.row}>
            <input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })}
              type={form.by === 'year' ? 'number' : 'text'}
              placeholder={form.by === 'year' ? 'Ex.: 1994' : `Buscar por ${MODES[form.by].toLowerCase()}…`} />
            {form.by !== 'year' && (
              <input className={styles.year} type="number" placeholder="Ano" value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })} />
            )}
            <button className="btn">Buscar</button>
          </div>
        </form>
      </section>

      <h2 className={styles.heading}>{q ? `Resultados para “${q}”` : 'Em alta'}</h2>
      {error && <p className="error">{error}</p>}
      {loading && movies.length === 0 && <p className={styles.empty}>Carregando…</p>}
      {!loading && !error && movies.length === 0 && <p className={styles.empty}>Nenhum filme encontrado.</p>}

      <div className={styles.grid}>
        {movies.map((movie) => <MovieCard key={movie.tmdbId} movie={movie} />)}
      </div>

      {page < totalPages && (
        <button className={`btn ${styles.more}`} onClick={() => load(page + 1)} disabled={loading}>
          {loading ? 'Carregando…' : 'Carregar mais'}
        </button>
      )}
    </div>
  );
}
