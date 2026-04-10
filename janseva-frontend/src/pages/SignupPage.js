import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import './AuthPage.css';

export default function SignupPage() {
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('citizen'); // ✅ NEW
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await register({ name, email, password, role }); // ✅ UPDATED

      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🏔️</span>
          <span className="auth-logo-text">
            JanSeva<span>AI</span>
          </span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">
          Join thousands reporting civic issues in Uttarakhand
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          
          {/* Name */}
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Aditya Singh"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* ✅ ROLE SELECTOR */}
          <div className="auth-field">
            <label className="auth-label">Select Role</label>

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
                🏛️ Government Officer
              </button>
            </div>

            <p className="auth-hint">
              Citizens report issues. Officers manage and resolve them.
            </p>
          </div>

          {/* Submit */}
          <button
            className={`auth-btn ${loading ? 'loading' : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}