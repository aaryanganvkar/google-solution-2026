// App.jsx - Corrected routing logic
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DocumentLibrary from './components/DocumentLibrary';
import InsightsDashboard from './components/InsightsDashboard';
import KnowledgeBase from './components/KnowledgeBase';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import AdminDashboard from './components/admin/AdminDashboard';
import DepartmentDashboard from './components/department/DepartmentDashboard';
import './components/Components.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    // Check localStorage for existing authentication
    const token = localStorage.getItem('userToken');
    const role = localStorage.getItem('userRole');
    const userData = localStorage.getItem('userData');
    
    if (token && role && userData) {
      const parsedData = JSON.parse(userData);
      setIsAuthenticated(true);
      setUserRole(role);
      setUserProfile({
        name: parsedData.username,
        role: parsedData.role === 'admin' ? 'System Administrator' : 'User',
        department: parsedData.department,
        email: parsedData.email,
        userId: parsedData.role === 'admin' ? 'ADMIN-001' : `USER-${parsedData.id || '001'}`,
        username: parsedData.username,
        password: parsedData.password // Store password for API calls
      });
      
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, role = 'user') => {
    // Store user data; token comes directly from userData if set by Login component
    const userToStore = {
      ...userData,
      password: userData.password || ''
    };
    
    // If the Login component already set the token in localStorage, keep it;
    // otherwise mark as authenticated so the app knows the user is logged in.
    const existingToken = localStorage.getItem('userToken');
    if (!existingToken) {
      localStorage.setItem('userToken', userData.token || 'authenticated');
    }
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(userToStore));
    
    setIsAuthenticated(true);
    setUserRole(role);
    setUserProfile(userToStore);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    // Clear all state
    setIsAuthenticated(false);
    setUserRole('user');
    setUserProfile(null);
    setDocuments([]);
  };

  // Protected Route wrapper
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (adminOnly && userRole !== 'admin') {
      return <Navigate to="/department-dashboard" />; // Redirect to department dashboard for non-admins
    }
    
    // Admins can also access regular user routes (library, insights, etc.)
    return children;
  };

  const AdminProtectedRoute = ({ children }) => {
    return <ProtectedRoute adminOnly={true}>{children}</ProtectedRoute>;
  };

  // Main Layout Component for regular users
  const MainLayout = ({ children }) => (
    <>
      <div className="sidebar-container">
        <Sidebar onLogout={handleLogout} userProfile={userProfile} />
      </div>
      <div className="main-container">
        <Navbar userProfile={userProfile} />
        <main className="main-content-area">
          {children}
        </main>
      </div>
    </>
  );

  // Simple Welcome Component for /dashboard route
  const WelcomeDashboard = () => {
    return (
      <div className="dashboard-overview">
        <div className="welcome-section">
          <h2>Welcome back, {userProfile?.name || 'User'}! 👋</h2>
          <p className="welcome-subtitle">
            Your centralized document management system
          </p>
        </div>
        
        <div className="dashboard-redirect">
          <h3>Quick Access</h3>
          <div className="redirect-cards">
            <div className="redirect-card" onClick={() => window.location.href = '/department-dashboard'}>
              <div className="card-icon">
                <Users size={32} /> {/* You'll need to import Users icon */}
              </div>
              <h4>Department Dashboard</h4>
              <p>Access department-specific documents and insights</p>
              <button className="redirect-btn">Go to Department View</button>
            </div>
            
            <div className="redirect-card" onClick={() => window.location.href = '/library'}>
              <div className="card-icon">
                <FileText size={32} /> {/* You'll need to import FileText icon */}
              </div>
              <h4>Document Library</h4>
              <p>Browse all available documents</p>
              <button className="redirect-btn">Go to Library</button>
            </div>
            
            <div className="redirect-card" onClick={() => window.location.href = '/insights'}>
              <div className="card-icon">
                <Brain size={32} /> {/* You'll need to import Brain icon */}
              </div>
              <h4>AI Insights</h4>
              <p>View AI-generated insights from documents</p>
              <button className="redirect-btn">View Insights</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/department-dashboard'} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Main Routes */}
          <Route path="/" element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/department-dashboard'} />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          {/* Regular User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <WelcomeDashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/department-dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <DepartmentDashboard userProfile={userProfile} />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/library" element={
            <ProtectedRoute>
              <MainLayout>
                <DocumentLibrary documents={documents} loading={loading} user={userProfile} />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/insights" element={
            <ProtectedRoute>
              <MainLayout>
                <InsightsDashboard documents={documents} loading={loading} />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/knowledge" element={
            <ProtectedRoute>
              <MainLayout>
                <KnowledgeBase documents={documents} loading={loading} />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <AdminProtectedRoute>
              <AdminDashboard onLogout={handleLogout} />
            </AdminProtectedRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;