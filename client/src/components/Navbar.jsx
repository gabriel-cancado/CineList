import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.bar}>
      <nav className={`container ${styles.nav}`}>
        <Link to="/" className={styles.logo}>CineList</Link>
        {/* New sections (diário, quero assistir, feed…) get a NavLink here. */}
        <div className={styles.links}>
          <NavLink to="/" end>Buscar</NavLink>
        </div>
        <div className={styles.user}>
          <span className={styles.avatar}>{user.name[0].toUpperCase()}</span>
          <span className={styles.name}>{user.name}</span>
          <button onClick={logout}>Sair</button>
        </div>
      </nav>
    </header>
  );
}
