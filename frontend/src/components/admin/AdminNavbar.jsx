// src/admin/AdminNavbar.jsx
import React from 'react';
import { Search, Bell, Settings, Shield, Database, Activity } from 'lucide-react';

const AdminNavbar = () => {
  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-content">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search system logs, users, or documents..."
            className="admin-search-input"
          />
        </div>

        <div className="admin-navbar-right">
          <div className="system-status">
            <Activity size={16} />
            <span className="status-indicator active"></span>
            <span className="status-text">System: Online</span>
          </div>

          <div className="admin-notifications">
            <button className="admin-icon-btn">
              <Bell size={20} />
              <span className="admin-badge">5</span>
            </button>
          </div>

          <div className="admin-profile">
            <div className="admin-profile-icon">
              <Shield size={20} />
            </div>
            <div className="admin-profile-info">
              <span className="admin-profile-name">Admin</span>
              <span className="admin-profile-role">System Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;