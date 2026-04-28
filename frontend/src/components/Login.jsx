import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => { checkBackendStatus(); }, []);

  const checkBackendStatus = async () => {
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/auth/health', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAdminToggle = () => {
    setIsAdminMode(!isAdminMode);
    setFormData({ username: '', password: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userData', JSON.stringify({ ...data.user, password: formData.password }));
        onLogin({ ...data.user, token: data.token, password: formData.password }, data.user.role);
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/department-dashboard');
      } else {
        const err = await res.json();
        setError(err.error || 'Login failed');
      }
    } catch {
      handleFallbackLogin();
    } finally {
      setLoading(false);
    }
  };

  const FALLBACK_USERS = {
    admin: { username: 'admin', password: 'admin123', userData: { id: 1, name: 'Administrator', username: 'admin', email: 'admin@infradoc.com', role: 'admin', department: 'admin', userId: 'ADMIN-001' } },
    engineer: { username: 'engineer', password: 'Engineer123', userData: { id: 2, name: 'John Engineer', username: 'engineer', email: 'engineer@infradoc.com', role: 'user', department: 'engineering', userId: 'ENG-002' } },
    operator: { username: 'operator', password: 'Operator123', userData: { id: 3, name: 'Sarah Operator', username: 'operator', email: 'operator@infradoc.com', role: 'user', department: 'operations', userId: 'OPS-003' } },
    safety: { username: 'safety', password: 'Safety123', userData: { id: 4, name: 'Mike Safety', username: 'safety', email: 'safety@infradoc.com', role: 'user', department: 'safety', userId: 'SAF-004' } },
    procurement: { username: 'procurement', password: 'Procurement123', userData: { id: 5, name: 'Lisa Procurement', username: 'procurement', email: 'procurement@infradoc.com', role: 'user', department: 'procurement', userId: 'PRO-005' } },
    hr: { username: 'hr', password: 'Hr123', userData: { id: 6, name: 'Emma HR', username: 'hr', email: 'hr@infradoc.com', role: 'user', department: 'hr', userId: 'HR-006' } },
    compliance: { username: 'compliance', password: 'Compliance123', userData: { id: 7, name: 'David Compliance', username: 'compliance', email: 'compliance@infradoc.com', role: 'user', department: 'compliance', userId: 'COM-007' } }
  };

  const handleFallbackLogin = () => {
    const key = formData.username.toLowerCase();
    const user = FALLBACK_USERS[key];
    if (user && user.password === formData.password) {
      localStorage.setItem('userToken', 'authenticated');
      localStorage.setItem('userRole', user.userData.role);
      localStorage.setItem('userData', JSON.stringify(user.userData));
      onLogin(user.userData, user.userData.role);
      setTimeout(() => {
        navigate(user.userData.role === 'admin' ? '/admin/dashboard' : '/department-dashboard');
        setLoading(false);
      }, 500);
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col">

      {/* Section 1 — Brand header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-on-surface leading-tight">DocIntel AI</p>
            <p className="text-[11px] text-on-surface-variant">Document Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {backendStatus === 'online' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Connected
            </div>
          )}
          {backendStatus === 'offline' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Fallback mode
            </div>
          )}
          {backendStatus === 'checking' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
              Connecting…
            </div>
          )}
        </div>
      </header>

      {/* Section 2 — Login form (centered, fills remaining height) */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-on-surface mb-2">
              {isAdminMode ? 'Admin Login' : 'Welcome back'}
            </h1>
            <p className="text-base text-on-surface-variant">
              {isAdminMode ? 'Administrator access to DocIntel AI' : 'Sign in to your document intelligence dashboard'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm mb-6">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-on-surface block mb-1.5" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder={isAdminMode ? 'Admin username' : 'Your username'}
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="username"
                className="w-full bg-surface-container rounded-xl border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface block mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder={isAdminMode ? 'Admin password' : 'Your password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full bg-surface-container rounded-xl border border-outline-variant px-4 py-3 pr-11 text-sm text-on-surface placeholder-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked disabled={loading} className="rounded border-outline-variant accent-primary" />
                  <span className="text-xs text-on-surface-variant">Remember me for 30 days</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Signing in…</>
                : (isAdminMode ? 'Sign in as Admin' : 'Sign in')
              }
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-on-surface-variant">
            {isAdminMode ? 'Regular user? ' : 'Administrator? '}
            <button type="button" onClick={handleAdminToggle} disabled={loading} className="text-primary hover:underline font-medium">
              {isAdminMode ? 'Switch to User Login' : 'Switch to Admin Login'}
            </button>
          </div>

          <div className="mt-3 text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </main>

      {/* Section 3 — Footer */}
      <footer className="px-10 py-5 border-t border-outline-variant flex items-center justify-between">
        <p className="text-xs text-on-surface-variant">© {new Date().getFullYear()} DocIntel AI. All rights reserved.</p>
        <div className="flex gap-4">
          {['React', 'Flask', 'AWS', 'DeepSeek'].map(t => (
            <span key={t} className="text-xs text-on-surface-variant">{t}</span>
          ))}
        </div>
      </footer>

    </div>
  );
};

export default Login;
