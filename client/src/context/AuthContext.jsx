import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, loginUser, registerUser } from '../api/auth';

const AuthContext = createContext(null);

// Keeps the logged user available to the whole app via useAuth().
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, restore the session if a saved token is still valid.
  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  function saveSession({ token, user }) {
    localStorage.setItem('token', token);
    setUser(user);
  }

  const login = async (email, password) => saveSession(await loginUser(email, password));
  const register = async (name, email, password) => saveSession(await registerUser(name, email, password));

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
