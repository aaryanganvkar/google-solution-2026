// components/admin/AdminSidebar.jsx
import React from 'react';
import { Upload, Users, BarChart, Settings, Home, Database, LogOut, Shield } from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'upload', icon: Upload, label: 'Upload Documents' },
    { id: 'users', icon: Users, label: 'User Management' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'database', icon: Database, label: 'Document Database' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    // Call the parent logout function if provided
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: clear all storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login'; // Force full page reload to clear React state
    }
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <div className="admin-badge">
          <Shield size={24} />
        </div>
        <div>
          <h2>InfraDoc Admin</h2>
          <p>Administrator Panel</p>
        </div>
      </div>

      <div className="admin-sidebar-section">
        <h3 className="admin-section-title">NAVIGATION</h3>
        <ul className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav-icon">
                <item.icon size={20} />
              </span>
              <span className="admin-nav-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">
            <span>A</span>
          </div>
          <div className="admin-info">
            <span className="admin-name">Administrator</span>
            <span className="admin-role">Super Admin</span>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;