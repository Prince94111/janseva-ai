import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Both fields are required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await login({ email, password });
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left Panel — Image ── */}
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <span className="auth-logo-mark">J</span>
            <span className="auth-left-logo-text">
              JanSeva<span>AI</span>
            </span>
          </div>
          <p className="auth-left-tagline">Apni awaaz, apna Uttarakhand</p>
          <p className="auth-left-sub">Report issues. Track progress.</p>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="auth-right">
        <div className="auth-card">

          {/* Logo top */}
          <div className="auth-logo">
            <span className="auth-logo-mark">J</span>
            <span className="auth-logo-text">
              JanSeva<span>AI</span>
            </span>
          </div>
          <p className="auth-portal-tag">CITIZEN PORTAL</p>

          <h1 className="auth-title">Namaskar! 🙏</h1>
          <p className="auth-sub">Sign in to report or track your civic issues</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              className={`auth-btn ${loading ? 'loading' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" /> Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            New citizen? <Link to="/signup">Register here</Link>
          </p>

          <div className="auth-footer-tag">
            <span className="auth-footer-dot" />
            Uttarakhand Government · Jan Seva Portal
          </div>

        </div>
      </div>
    </div>
  );
}