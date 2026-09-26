import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

// Wraps every page that requires login; visitors are sent to /login.
export default function Layout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <main style={{ paddingBottom: 80 }}>
        <Outlet />
      </main>
    </>
  );
}
