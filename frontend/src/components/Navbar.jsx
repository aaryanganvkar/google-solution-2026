// components/Navbar.jsx
import React from 'react';
import './Navbar.css';
import { Bell, Search, Settings, User, Filter } from 'lucide-react';

const Navbar = ({ userProfile }) => {
  return (
    <nav className="navbar">
      <div className="navbar-search">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search documents, insights, or reports..."
          className="search-input"
        />
        <button className="filter-btn">
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>
      
      <div className="navbar-actions">
        <div className="user-info">
          <div className="user-details">
            <span className="user-name">{userProfile?.name || 'Loading...'}</span>
            <span className="user-role">{userProfile?.role || 'User'}</span>
          </div>
          <div className="user-avatar-small">
            <User size={20} />
          </div>
        </div>
        
        <button className="nav-action-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        
        <button className="nav-action-btn">
          <Settings size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;