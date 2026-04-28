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

  const WelcomeDashboard = () => {
    const quickLinks = [
      { icon: 'group', label: 'Department Dashboard', desc: 'Access department-specific documents and insights', href: '/department-dashboard', btnLabel: 'Open Dashboard' },
      { icon: 'description', label: 'Document Library', desc: 'Browse and search all available documents', href: '/library', btnLabel: 'Browse Library' },
      { icon: 'psychology', label: 'AI Insights', desc: 'View AI-generated insights from your documents', href: '/insights', btnLabel: 'View Insights' },
      { icon: 'menu_book', label: 'Knowledge Base', desc: 'Explore the central knowledge repository', href: '/knowledge', btnLabel: 'Explore Knowledge' },
    ];

    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-h1 font-h1 text-on-surface">Welcome back, {userProfile?.name || 'User'}!</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">Your centralized document management system</p>
        </div>

        <p className="text-[13px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Quick Access</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-lg">
          {quickLinks.map(link => (
            <div key={link.href} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[22px] text-primary">{link.icon}</span>
              </div>
              <h3 className="text-h3 font-h3 text-on-surface mb-1">{link.label}</h3>
              <p className="text-body-sm text-on-surface-variant flex-1 mb-4">{link.desc}</p>
              <button
                onClick={() => window.location.href = link.href}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                {link.btnLabel}
              </button>
            </div>
          ))}
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