// components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import './LoginSignup.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
      console.warn('Backend is not reachable, using fallback login');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAdminToggle = () => {
    setIsAdminMode(!isAdminMode);
    setFormData({
      username: '',
      password: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Store the real JWT token so all subsequent API calls can use Bearer auth
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userData', JSON.stringify({
          ...data.user,
          password: formData.password
        }));

        // Notify App.jsx
        onLogin({
          ...data.user,
          token: data.token,
          password: formData.password
        }, data.user.role);

        // Navigate based on role
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/department-dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fall back to local auth if backend is offline
      handleFallbackLogin();
    } finally {
      setLoading(false);
    }
  };
  const handleFallbackLogin = () => {
    // Fallback test users (remove in production)
    const testUsers = {
      admin: {
        username: 'admin',
        password: 'admin123',
        userData: {
          id: 1,
          name: 'Administrator',
          username: 'admin',
          email: 'admin@infradoc.com',
          role: 'admin',
          department: 'admin',
          userId: 'ADMIN-001'
        }
      },
      engineer: {
        username: 'engineer',
        password: 'Engineer123',
        userData: {
          id: 2,
          name: 'John Engineer',
          username: 'engineer',
          email: 'engineer@infradoc.com',
          role: 'user',
          department: 'engineering',
          userId: 'ENG-002'
        }
      },
      operator: {
        username: 'operator',
        password: 'Operator123',
        userData: {
          id: 3,
          name: 'Sarah Operator',
          username: 'operator',
          email: 'operator@infradoc.com',
          role: 'user',
          department: 'operations',
          userId: 'OPS-003'
        }
      },
      safety: {
        username: 'safety',
        password: 'Safety123',
        userData: {
          id: 4,
          name: 'Mike Safety',
          username: 'safety',
          email: 'safety@infradoc.com',
          role: 'user',
          department: 'safety',
          userId: 'SAF-004'
        }
      },
      procurement: {
        username: 'procurement',
        password: 'Procurement123',
        userData: {
          id: 5,
          name: 'Lisa Procurement',
          username: 'procurement',
          email: 'procurement@infradoc.com',
          role: 'user',
          department: 'procurement',
          userId: 'PRO-005'
        }
      },
      hr: {
        username: 'hr',
        password: 'Hr123',
        userData: {
          id: 6,
          name: 'Emma HR',
          username: 'hr',
          email: 'hr@infradoc.com',
          role: 'user',
          department: 'hr',
          userId: 'HR-006'
        }
      },
      compliance: {
        username: 'compliance',
        password: 'Compliance123',
        userData: {
          id: 7,
          name: 'David Compliance',
          username: 'compliance',
          email: 'compliance@infradoc.com',
          role: 'user',
          department: 'compliance',
          userId: 'COM-007'
        }
      }
    };

    // Find matching user
    const username = formData.username.toLowerCase();
    const password = formData.password;

    if (testUsers[username] && testUsers[username].password === password) {
      const user = testUsers[username];
      
      localStorage.setItem('userToken', 'authenticated');
      localStorage.setItem('userRole', user.userData.role);
      localStorage.setItem('userData', JSON.stringify(user.userData));
      
      onLogin(user.userData, user.userData.role);
      
      setTimeout(() => {
        if (user.userData.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/department-dashboard');
        }
        setLoading(false);
      }, 500);
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  const handleQuickLogin = (userKey) => {
    const testUsers = {
      admin: { username: 'admin', password: 'admin123', userData: { id: 1, name: 'Administrator', username: 'admin', email: 'admin@infradoc.com', role: 'admin', department: 'admin' } },
      engineer: { username: 'engineer', password: 'Engineer123', userData: { id: 2, name: 'John Engineer', username: 'engineer', email: 'engineer@infradoc.com', role: 'user', department: 'engineering' } },
      operator: { username: 'operator', password: 'Operator123', userData: { id: 3, name: 'Sarah Operator', username: 'operator', email: 'operator@infradoc.com', role: 'user', department: 'operations' } },
      safety: { username: 'safety', password: 'Safety123', userData: { id: 4, name: 'Mike Safety', username: 'safety', email: 'safety@infradoc.com', role: 'user', department: 'safety' } },
      procurement: { username: 'procurement', password: 'Procurement123', userData: { id: 5, name: 'Lisa Procurement', username: 'procurement', email: 'procurement@infradoc.com', role: 'user', department: 'procurement' } },
      hr: { username: 'hr', password: 'Hr123', userData: { id: 6, name: 'Emma HR', username: 'hr', email: 'hr@infradoc.com', role: 'user', department: 'hr' } },
      compliance: { username: 'compliance', password: 'Compliance123', userData: { id: 7, name: 'David Compliance', username: 'compliance', email: 'compliance@infradoc.com', role: 'user', department: 'compliance' } }
    };

    const user = testUsers[userKey];
    if (!user) return;

    setLoading(true);
    setFormData({ username: user.username, password: user.password });

    const userToStore = { ...user.userData, password: user.password };
    localStorage.setItem('userToken', 'authenticated');
    localStorage.setItem('userRole', user.userData.role);
    localStorage.setItem('userData', JSON.stringify(userToStore));

    onLogin(userToStore, user.userData.role);

    setTimeout(() => {
      if (user.userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/department-dashboard');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="login-page">
      {/* Left Section - Form */}
      <div className="form-section">
        <div className="form-container">
          <div className="logo">
            <div className="logo-icon">
              <Shield size={24} />
            </div>
            <h2>InfraDoc AI</h2>
          </div>

          <div className="login-header">
            <h1>{isAdminMode ? 'Admin Login' : 'Welcome to InfraDoc AI'}</h1>
            <p className="subtitle">
              {isAdminMode 
                ? 'Administrator access to document management system'
                : 'Sign in to access your document intelligence dashboard'}
            </p>
          </div>

          {/* Backend Status Indicator */}
          <div className={`backend-status ${backendStatus}`}>
            {backendStatus === 'online' && (
              <span className="status-online">
                <CheckCircle size={14} /> Backend connected
              </span>
            )}
            {backendStatus === 'offline' && (
              <span className="status-offline">
                <AlertCircle size={14} /> Using fallback mode
              </span>
            )}
            {backendStatus === 'checking' && (
              <span className="status-checking">
                Checking backend connection...
              </span>
            )}
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder={isAdminMode ? "Enter admin username" : "Enter your username"}
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder={isAdminMode ? "Enter admin password" : "Enter your password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <span 
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
              <div className="forgot-password">
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="remember" 
                defaultChecked 
                disabled={loading}
              />
              <label htmlFor="remember">Remember me for 30 days</label>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Signing in...
                </span>
              ) : (
                isAdminMode ? 'Sign in as Admin' : 'Sign in'
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="account-link">
              {isAdminMode ? 'Regular user?' : "Don't have an account?"}{' '}
              <button 
                type="button"
                className="link-button"
                onClick={handleAdminToggle}
                disabled={loading}
              >
                {isAdminMode ? 'Switch to User Login' : 'Switch to Admin Login'}
              </button>
            </div>

            <div className="divider">
              <span>or</span>
            </div>

            {/* Quick Login for Testing */}
            <div className="quick-login">
              <p className="quick-login-label">Quick Login (Testing):</p>
              <div className="quick-login-buttons">
                <button 
                  type="button"
                  className="quick-btn admin"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                >
                  Admin
                </button>
                <button 
                  type="button"
                  className="quick-btn engineering"
                  onClick={() => handleQuickLogin('engineer')}
                  disabled={loading}
                >
                  Engineering
                </button>
                <button 
                  type="button"
                  className="quick-btn operations"
                  onClick={() => handleQuickLogin('operator')}
                  disabled={loading}
                >
                  Operations
                </button>
                <button 
                  type="button"
                  className="quick-btn safety"
                  onClick={() => handleQuickLogin('safety')}
                  disabled={loading}
                >
                  Safety
                </button>
                <button 
                  type="button"
                  className="quick-btn procurement"
                  onClick={() => handleQuickLogin('procurement')}
                  disabled={loading}
                >
                  Procurement
                </button>
                <button 
                  type="button"
                  className="quick-btn hr"
                  onClick={() => handleQuickLogin('hr')}
                  disabled={loading}
                >
                  HR
                </button>
                <button 
                  type="button"
                  className="quick-btn compliance"
                  onClick={() => handleQuickLogin('compliance')}
                  disabled={loading}
                >
                  Compliance
                </button>
              </div>
            </div>

            <div className="register-link">
              <p>Need an account? <Link to="/register">Register here</Link></p>
            </div>

            <div className="backend-info">
              <p className="info-note">
                {backendStatus === 'online' 
                  ? '✅ Connected to backend API' 
                  : '⚠️ Using local authentication (backend offline)'}
              </p>
            </div>

            <div className="copyright">
              © {new Date().getFullYear()} InfraDoc AI. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Dashboard Preview */}
      <div className="image-section">
        <div className="dashboard-preview">
          <h2>Document Intelligence Platform</h2>
          <p>AI-powered insights for infrastructure management</p>
          
          <div className="dashboard-cards">
            <div className="main-card">
              <h3>InfraDoc AI Dashboard</h3>
              <div className="stats">
                <div className="stat-item">
                  <span className="stat-label">Departments</span>
                  <span className="stat-value">7</span>
                  <span className="stat-change">Engineering, Operations, Safety, etc.</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">AI Processing</span>
                  <span className="stat-value">97.2%</span>
                  <span className="stat-change">Document accuracy rate</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Response Time</span>
                  <span className="stat-value">&lt; 5s</span>
                  <span className="stat-change">Per document analysis</span>
                </div>
              </div>
            </div>
            
            <div className="overlay-card">
              <h4>Features</h4>
              <ul className="features-list">
                <li>✓ Automatic document categorization</li>
                <li>✓ Department-specific routing</li>
                <li>✓ AI-powered insights extraction</li>
                <li>✓ Secure AWS S3 storage</li>
                <li>✓ Real-time processing</li>
                <li>✓ Role-based access control</li>
              </ul>
            </div>
          </div>

          <div className="test-credentials">
            <h4>Test Credentials:</h4>
            <div className="credential-list">
              <div className="credential-item">
                <strong>Admin:</strong> admin / admin123
              </div>
              <div className="credential-item">
                <strong>Engineering:</strong> engineer / Engineer123
              </div>
              <div className="credential-item">
                <strong>Operations:</strong> operator / Operator123
              </div>
              <div className="credential-item">
                <strong>Safety:</strong> safety / Safety123
              </div>
            </div>
          </div>

          <div className="partner-logos">
            <span>Powered by cutting-edge technologies</span>
            <div className="logos">
              <span>React</span>
              <span>Flask</span>
              <span>AWS</span>
              <span>DeepSeek</span>
              <span>Python</span>
              <span>SQLite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;