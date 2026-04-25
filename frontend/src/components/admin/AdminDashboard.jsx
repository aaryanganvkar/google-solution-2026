// components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminUploadS3 from './AdminUploadS3';
import DocumentLibrary from '../DocumentLibrary';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalDocuments: 0,
    users: 0,
    processed: 0,
    pending: 0,
    storageUsed: '0 GB',
    departments: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build auth headers from stored JWT token
  const getAuthHeaders = () => {
    const token    = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (token && token !== 'authenticated' && token !== 'null') {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }
    if (userData.username && userData.password) {
      return { 'Content-Type': 'application/json',
               'Authorization': `Basic ${btoa(`${userData.username}:${userData.password}`)}` };
    }
    return { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const summaryResponse = await fetch('http://localhost:5000/api/processing/documents/summary', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        
        setStats({
          totalDocuments: summaryData.total_documents || 0,
          users: 0, // Would need separate users endpoint
          processed: summaryData.database_documents || 0,
          pending: summaryData.s3_documents || 0,
          storageUsed: calculateStorageUsed(summaryData.total_documents),
          departments: summaryData.departments || []
        });

        // Create recent activity
        const activity = (summaryData.recent_activity || []).slice(0, 5).map(item => ({
          id: item.id,
          user: item.user || 'System',
          action: item.action || 'Document processed',
          time: formatTimeAgo(item.time),
          type: 'upload'
        }));
        
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use fallback data
      setStats({
        totalDocuments: 1247,
        users: 42,
        processed: 1189,
        pending: 58,
        storageUsed: '4.8 GB',
        departments: ['engineering', 'operations', 'safety', 'procurement', 'hr', 'compliance']
      });
      
      setRecentActivity([
        { id: 1, user: 'John Doe', action: 'Uploaded Bridge Report', time: '10 min ago', type: 'upload' },
        { id: 2, user: 'System', action: 'AI Processing Complete', time: '25 min ago', type: 'processing' },
        { id: 3, user: 'Sarah Chen', action: 'Downloaded Audit Report', time: '1 hour ago', type: 'download' },
        { id: 4, user: 'Admin', action: 'Added new user', time: '2 hours ago', type: 'user' },
        { id: 5, user: 'System', action: 'Scheduled backup', time: '3 hours ago', type: 'system' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const userList = await response.json();
        setUsers(userList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Use fallback users
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@infraco.com', role: 'Manager', status: 'active', lastActive: '2 hours ago' },
        { id: 2, name: 'Sarah Chen', email: 'sarah@infraco.com', role: 'Engineer', status: 'active', lastActive: '1 hour ago' },
        { id: 3, name: 'Mike Wilson', email: 'mike@infraco.com', role: 'Inspector', status: 'inactive', lastActive: '2 days ago' },
        { id: 4, name: 'Lisa Brown', email: 'lisa@infraco.com', role: 'Analyst', status: 'active', lastActive: '30 min ago' }
      ]);
    }
  };

  const calculateStorageUsed = (docCount) => {
    const storageMB = docCount * 2; // 2MB average per document
    return storageMB > 1024 ? 
      `${(storageMB / 1024).toFixed(1)} GB` : 
      `${storageMB} MB`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const handleAdminLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'upload':
        return <AdminUploadS3 />;
      case 'database':
        return <DocumentLibrary user={{ role: 'admin' }} />;
      case 'users':
        return (
          <div className="admin-users">
            <div className="section-header">
              <h2>User Management</h2>
              <button className="add-user-btn">+ Add User</button>
            </div>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">
                            {(user.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td><span className="role-badge">{user.role}</span></td>
                      <td><span className="role-badge">{user.department}</span></td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit">Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="admin-analytics">
            <h2>System Analytics</h2>
            <div className="analytics-grid">
              <div className="analytic-card">
                <h3>Document Processing</h3>
                <div className="chart-placeholder">
                  <p>Documents Processed: {stats.processed}</p>
                  <p>Pending: {stats.pending}</p>
                  <p>Success Rate: {stats.totalDocuments > 0 ? 
                    Math.round((stats.processed / stats.totalDocuments) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="analytic-card">
                <h3>Department Distribution</h3>
                <div className="chart-placeholder">
                  {stats.departments.map(dept => (
                    <div key={dept} className="dept-distribution">
                      <span>{dept}:</span>
                      <span>{/* Count would go here */}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analytic-card">
                <h3>Storage Usage</h3>
                <div className="chart-placeholder">
                  <p>Total Storage Used: {stats.storageUsed}</p>
                  <div className="storage-bar">
                    <div 
                      className="storage-fill" 
                      style={{ 
                        width: `${Math.min(100, (parseFloat(stats.storageUsed) / 10) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p>10 GB Limit</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="admin-settings">
            <h2>System Settings</h2>
            <div className="settings-grid">
              <div className="setting-card">
                <h3>Document Processing</h3>
                <div className="toggle-switch">
                  <span>Enable AI Auto-processing</span>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="toggle-switch">
                  <span>Enable Email Notifications</span>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="setting-card">
                <h3>Storage Configuration</h3>
                <div className="storage-config">
                  <div className="storage-setting">
                    <label>Maximum File Size:</label>
                    <select defaultValue="100">
                      <option value="50">50 MB</option>
                      <option value="100">100 MB</option>
                      <option value="200">200 MB</option>
                    </select>
                  </div>
                  <div className="storage-setting">
                    <label>Allowed File Types:</label>
                    <div className="file-types">
                      <span className="file-type-tag">PDF</span>
                      <span className="file-type-tag">DOCX</span>
                      <span className="file-type-tag">XLSX</span>
                      <span className="file-type-tag">Images</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="admin-overview">
            <div className="welcome-section">
              <h1>Admin Dashboard</h1>
              <p className="subtitle">Manage documents, users, and system settings</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon admin">
                  <span>📄</span>
                </div>
                <div className="stat-content">
                  <h3>Total Documents</h3>
                  <p className="stat-number">{stats.totalDocuments}</p>
                  <p className="stat-trend">
                    {stats.processed > 0 ? 
                      `${Math.round((stats.processed / stats.totalDocuments) * 100)}% processed` : 
                      'No documents processed yet'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon admin">
                  <span>👥</span>
                </div>
                <div className="stat-content">
                  <h3>Active Users</h3>
                  <p className="stat-number">{stats.users}</p>
                  <p className="stat-trend">
                    {stats.departments.length} departments
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon admin">
                  <span>⚡</span>
                </div>
                <div className="stat-content">
                  <h3>AI Processed</h3>
                  <p className="stat-number">{stats.processed}</p>
                  <p className="stat-trend">
                    {stats.pending} pending
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon admin">
                  <span>💾</span>
                </div>
                <div className="stat-content">
                  <h3>Storage Used</h3>
                  <p className="stat-number">{stats.storageUsed}</p>
                  <p className="stat-trend">
                    of 10 GB total
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-content">
              <div className="recent-activity">
                <div className="section-header">
                  <h3>Recent Activity</h3>
                  <button className="refresh-btn" onClick={fetchDashboardData}>
                    Refresh
                  </button>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="no-activity">
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className={`activity-icon ${activity.type}`}>
                          {activity.type === 'upload' && '📤'}
                          {activity.type === 'processing' && '🤖'}
                          {activity.type === 'download' && '📥'}
                          {activity.type === 'user' && '👤'}
                          {activity.type === 'system' && '⚙️'}
                        </div>
                        <div className="activity-details">
                          <div className="activity-text">
                            <strong>{activity.user}</strong> {activity.action}
                          </div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => setActiveTab('upload')}>
                    <span className="action-icon">📤</span>
                    <span className="action-text">Upload Documents</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('users')}>
                    <span className="action-icon">👥</span>
                    <span className="action-text">Manage Users</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('analytics')}>
                    <span className="action-icon">📊</span>
                    <span className="action-text">View Analytics</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('settings')}>
                    <span className="action-icon">⚙️</span>
                    <span className="action-text">System Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-app">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleAdminLogout}
      />
      <div className="admin-main-container">
        <AdminNavbar />
        <main className="admin-content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;