import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

// Used for both /login and /register; `mode` decides which fields and action to show.
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.logo}>CineList</h1>
        <p className={styles.tagline}>
          {isRegister ? 'Crie sua conta e comece seu diário de cinema.' : 'Bem-vindo de volta.'}
        </p>

        {isRegister && (
          <label>
            Nome
            <input value={form.name} onChange={update('name')} required autoFocus />
          </label>
        )}
        <label>
          E-mail
          <input type="email" value={form.email} onChange={update('email')} required autoFocus={!isRegister} />
        </label>
        <label>
          Senha
          <input type="password" value={form.password} onChange={update('password')} required minLength={6} />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn" disabled={submitting}>
          {submitting ? 'Aguarde…' : isRegister ? 'Criar conta' : 'Entrar'}
        </button>

        <p className={styles.switch}>
          {isRegister ? 'Já tem conta? ' : 'Ainda não tem conta? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Entrar' : 'Cadastre-se'}</Link>
        </p>
      </form>
    </div>
  );
}
