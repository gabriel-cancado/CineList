import { Link } from 'react-router-dom';
import styles from './MovieCard.module.css';

// Poster + title + year; links to the movie page.
export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.tmdbId}`} className={styles.card}>
      <div className={styles.poster}>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
        ) : (
          <span className={styles.noPoster}>{movie.title}</span>
        )}
      </div>
      <h3 className={styles.title}>{movie.title}</h3>
      {movie.year && <span className={styles.year}>{movie.year}</span>}
    </Link>
  );
}
