import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import './AuthPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('citizen');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('All fields are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await register({ name, email, password, role });
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left Panel ── */}
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
          <p className="auth-left-sub">Join thousands making Uttarakhand better.</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-card">

          <div className="auth-logo">
            <span className="auth-logo-mark">J</span>
            <span className="auth-logo-text">
              JanSeva<span>AI</span>
            </span>
          </div>
          <p className="auth-portal-tag">CITIZEN PORTAL</p>

          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Join thousands reporting civic issues in Uttarakhand</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Prince Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">I am a</label>
              <div className="auth-role-row">
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'citizen' ? 'active' : ''}`}
                  onClick={() => setRole('citizen')}
                >
                  👤 Citizen
                </button>
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'officer' ? 'active' : ''}`}
                  onClick={() => setRole('officer')}
                >
                  🏛️ Gov Officer
                </button>
              </div>
            </div>

            <button
              className={`auth-btn ${loading ? 'loading' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" /> Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
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