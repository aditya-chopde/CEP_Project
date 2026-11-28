import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { http } from '../hooks/useApi.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef(null);

  // If already logged in, redirect to panel
  useEffect(() => {
    if (sessionStorage.getItem('adminToken')) {
      navigate('/admin/panel', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await http.post('/admin/login', { username: username.trim(), password });
      sessionStorage.setItem('adminToken', res.data.data.token);
      navigate('/admin/panel', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="cs-admin-login">
      <div className="cs-admin-login__card">
        <div className="cs-admin-login__icon">🔒</div>
        <h1 className="cs-title" style={{ textAlign: 'center', marginBottom: 4 }}>
          Admin Login
        </h1>
        <p className="cs-muted" style={{ textAlign: 'center' }}>
          Sign in to access the admin dashboard
        </p>

        <form className="cs-form" onSubmit={onSubmit} noValidate>
          {error && (
            <div className="cs-formerr" role="alert">
              {error}
            </div>
          )}

          <div className="cs-field">
            <label className="cs-label" htmlFor="admin-user">
              Username
            </label>
            <input
              id="admin-user"
              ref={userRef}
              className="cs-input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="cs-field">
            <label className="cs-label" htmlFor="admin-pass">
              Password
            </label>
            <input
              id="admin-pass"
              className="cs-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          <button
            type="submit"
            className="cs-btn cs-btn--primary"
            disabled={loading}
            aria-busy={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
