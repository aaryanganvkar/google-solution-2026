import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import './LoginSignup.css';

const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'engineering'
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await authAPI.getDepartments();
      // Make sure response is an array before filtering
      if (Array.isArray(response)) {
        setDepartments(response.filter(dept => dept !== 'admin'));
      } else {
        // If response is not an array, use default departments
        setDepartments(['engineering', 'operations', 'procurement', 'hr', 'safety', 'compliance']);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      // Fallback to default departments
      setDepartments(['engineering', 'operations', 'procurement', 'hr', 'safety', 'compliance']);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await authAPI.register(registrationData);
      
      if (response.user) {
        onRegister(response.user); // Call the onRegister callback
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Default departments in case API fails
  const defaultDepartments = ['engineering', 'operations', 'procurement', 'hr', 'safety', 'compliance'];
  const departmentsToDisplay = departments.length > 0 ? departments : defaultDepartments;

  return (
    <div className="login-page">
      <div className="form-section">
        <div className="form-container">
          <div className="logo">
            <div className="logo-icon">DM</div>
          </div>
          
          <h1>Create Account</h1>
          <p className="subtitle">Register to access the document management system</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="department">Department *</label>
              {loadingDepartments ? (
                <div style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  background: '#f3f4f6',
                  color: '#6b7280'
                }}>
                  Loading departments...
                </div>
              ) : (
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-group input"
                  required
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s',
                    background: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {departmentsToDisplay.map(dept => (
                    <option key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min. 6 characters)"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>

            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="terms" 
                required 
                disabled={loading}
              />
              <label htmlFor="terms">
                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            </div>

            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading || loadingDepartments}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="account-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

          <div className="copyright">
            © 2024 Document Management System. All rights reserved.
          </div>
        </div>
      </div>

      <div className="image-section">
        <div className="dashboard-preview">
          <h2>Secure Document Management</h2>
          <p>Store, organize, and share company documents with role-based access control.</p>
          
          <div className="dashboard-cards">
            <div className="main-card">
              <h3>Features</h3>
              <div className="features-list" style={{ color: '#1f2937' }}>
                <div>• Role-based access control</div>
                <div>• Department-specific documents</div>
                <div>• Secure file uploads</div>
                <div>• Document versioning</div>
                <div>• Search and filter capabilities</div>
                <div>• Audit trail</div>
              </div>
            </div>
          </div>

          <div className="partner-logos">
            <span>Trusted by departments across the organization</span>
            <div className="logos">
              <span>Engineering</span>
              <span>Operations</span>
              <span>Procurement</span>
              <span>HR</span>
              <span>Safety</span>
              <span>Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;