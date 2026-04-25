// components/Sidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, BarChart3, Home, Database, Bell, Settings, User, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onLogout, userProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: Home, label: 'Dashboard' },
    { id: 'library', path: '/library', icon: FileText, label: 'My Documents', badge: 4 },
    { id: 'insights', path: '/insights', icon: BarChart3, label: 'AI Insights', badge: 12 },
    { id: 'knowledge', path: '/knowledge', icon: Database, label: 'Knowledge Base' },
  ];

  const secondaryItems = [
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'Notifications', badge: 3 },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    console.log('Logging out...');
    
    // Clear any user data from localStorage/sessionStorage
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userSession');
    
    // Clear any app-specific data
    localStorage.removeItem('appState');
    
    // Redirect to login page
    navigate('/login');
    
    // If you want to fully reload the app:
    // window.location.href = '/login';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>InfraDoc AI</h2>
        <p>Document Intelligence</p>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">MAIN</h3>
        <ul className="sidebar-nav">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link 
                to={item.path} 
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <item.icon size={20} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">PREFERENCES</h3>
        <ul className="sidebar-nav">
          {secondaryItems.map((item) => (
            <li key={item.id}>
              <Link 
                to={item.path} 
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <item.icon size={20} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">John Doe</span>
            <span className="user-status">Infrastructure Manager</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout || handleLogout}>
          <LogOut size={16} style={{ marginRight: '8px' }} />
          Logout
        </button>
        
        
        <div className="user-info">
          <span className="user-name">{userProfile?.name || 'John Doe'}</span>
          <span className="user-status">{userProfile?.role || 'Infrastructure Manager'}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;