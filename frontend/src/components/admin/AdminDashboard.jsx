import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminUploadS3 from './AdminUploadS3';
import DocumentLibrary from '../DocumentLibrary';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalDocuments: 0, users: 0, processed: 0, pending: 0,
    storageUsed: '0 GB', departments: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (token && token !== 'authenticated' && token !== 'null') {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }
    if (userData.username && userData.password) {
      return { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(`${userData.username}:${userData.password}`)}` };
    }
    return { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboardData();
    else if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/processing/documents/summary', { method: 'GET', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalDocuments: data.total_documents || 0,
          users: 0,
          processed: data.database_documents || 0,
          pending: data.s3_documents || 0,
          storageUsed: calculateStorageUsed(data.total_documents),
          departments: data.departments || []
        });
        setRecentActivity((data.recent_activity || []).slice(0, 5).map(item => ({
          id: item.id, user: item.user || 'System',
          action: item.action || 'Document processed',
          time: formatTimeAgo(item.time), type: 'upload'
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Removed placeholder values
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/auth/users', { method: 'GET', headers: getAuthHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error('Error fetching users:', error);
      // Removed placeholder values
    }
  };

  const calculateStorageUsed = (docCount) => {
    const mb = docCount * 2;
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const diffMins = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const activityIcon = { upload: 'upload', processing: 'smart_toy', download: 'download', user: 'person', system: 'settings' };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <AdminUploadS3 />;

      case 'database':
        return <DocumentLibrary user={{ role: 'admin' }} />;

      case 'users':
        return (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-h1 font-h1 text-on-surface">User Management</h1>
              <button className="flex items-center gap-2 bg-primary text-on-primary px-md py-sm rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Add User
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-md border-b border-outline-variant bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-[14px]">filter_list</span>
                    Filter
                  </button>
                  <span className="text-xs text-on-surface-variant">Showing {users.length} users</span>
                </div>
                <button onClick={fetchUsers} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.8fr_1fr_0.5fr] gap-3 px-md py-2 bg-surface-container-low border-b border-outline-variant">
                {['User', 'Email', 'Role', 'Department', 'Status', 'Last Login', ''].map(h => (
                  <p key={h} className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{h}</p>
                ))}
              </div>

              {/* Rows */}
              {users.map((u, i) => {
                const initials = (u.username || u.name || 'U').slice(0, 2).toUpperCase();
                const bgColors = ['bg-primary-fixed', 'bg-secondary-fixed', 'bg-tertiary-fixed'];
                const bg = bgColors[i % bgColors.length];
                const statusStyle = u.is_active
                  ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                  : 'text-on-surface-variant bg-surface-variant';
                return (
                  <div key={u.id} className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.8fr_1fr_0.5fr] gap-3 items-center px-md py-3 border-b border-outline-variant/50 hover:bg-surface-container-low/50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center text-[10px] font-bold text-on-surface flex-shrink-0`}>{initials}</div>
                      <span className="text-sm text-on-surface font-medium truncate">{u.username || u.name}</span>
                    </div>
                    <span className="text-sm text-on-surface-variant truncate">{u.email || '—'}</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-medium w-fit">{u.role || '—'}</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium w-fit">{u.department || '—'}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${statusStyle}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-on-surface-variant">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary font-medium hover:underline">Edit</button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-h1 font-h1 text-on-surface mb-6">System Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              {[
                { title: 'Document Processing', rows: [['Processed', stats.processed], ['Pending', stats.pending], ['Success Rate', `${stats.totalDocuments > 0 ? Math.round((stats.processed / stats.totalDocuments) * 100) : 0}%`]] },
                { title: 'Department Distribution', rows: stats.departments.map(d => [d, '']) },
                { title: 'Storage Usage', rows: [['Used', stats.storageUsed], ['Limit', '10 GB'], ['Available', `${(10 - parseFloat(stats.storageUsed || 0)).toFixed(1)} GB`]] },
              ].map(card => (
                <div key={card.title} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                  <h2 className="text-h3 font-h3 text-on-surface mb-4">{card.title}</h2>
                  <div className="space-y-3">
                    {card.rows.map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant capitalize">{label}</span>
                        {val && <span className="font-medium text-on-surface">{val}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-h1 font-h1 text-on-surface mb-6">System Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                <h2 className="text-h3 font-h3 text-on-surface mb-4">Document Processing</h2>
                {[['Enable AI Auto-processing', true], ['Enable Email Notifications', true]].map(([label, def]) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-outline-variant/50 last:border-0">
                    <span className="text-sm text-on-surface">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={def} className="sr-only peer" />
                      <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:bg-primary-container transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                <h2 className="text-h3 font-h3 text-on-surface mb-4">Storage Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Maximum File Size</label>
                    <select defaultValue="100" className="w-full text-sm bg-surface-container rounded-lg border border-outline-variant px-3 py-2 text-on-surface outline-none">
                      <option value="50">50 MB</option>
                      <option value="100">100 MB</option>
                      <option value="200">200 MB</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-2 block">Allowed File Types</label>
                    <div className="flex flex-wrap gap-2">
                      {['PDF', 'DOCX', 'XLSX', 'Images'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-6">
              <h1 className="text-h1 font-h1 text-on-surface">Admin Dashboard</h1>
              <p className="text-body-md text-on-surface-variant mt-0.5">Manage documents, users, and system settings</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-lg mb-6">
              {[
                { label: 'Total Documents', value: stats.totalDocuments, sub: `${stats.processed > 0 && stats.totalDocuments > 0 ? Math.round((stats.processed / stats.totalDocuments) * 100) : 0}% processed`, icon: 'description' },
                { label: 'Active Users', value: stats.users, sub: `${stats.departments.length} departments`, icon: 'group' },
                { label: 'AI Processed', value: stats.processed, sub: `${stats.pending} pending`, icon: 'smart_toy' },
                { label: 'Storage Used', value: stats.storageUsed, sub: 'of 10 GB total', icon: 'storage' },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{s.icon}</span>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-on-surface mb-1">{s.value}</p>
                  <p className="text-[11px] text-on-surface-variant">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
              {/* Recent activity */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-h3 font-h3 text-on-surface">Recent Activity</h2>
                  <button onClick={fetchDashboardData} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Refresh
                  </button>
                </div>
                {recentActivity.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant py-4">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map(a => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-on-primary-fixed-variant">{activityIcon[a.type] || 'circle'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface"><strong>{a.user}</strong> {a.action}</p>
                          <p className="text-[11px] text-on-surface-variant">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                <h2 className="text-h3 font-h3 text-on-surface mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tab: 'upload', icon: 'upload_file', label: 'Upload Documents' },
                    { tab: 'users', icon: 'group', label: 'Manage Users' },
                    { tab: 'analytics', icon: 'monitoring', label: 'View Analytics' },
                    { tab: 'settings', icon: 'settings', label: 'System Settings' },
                  ].map(a => (
                    <button
                      key={a.tab}
                      onClick={() => setActiveTab(a.tab)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[24px] text-primary-container">{a.icon}</span>
                      <span className="text-xs font-medium text-on-surface">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <div className="flex flex-col flex-1 ml-[240px] overflow-hidden">
        <AdminNavbar activeTab={activeTab} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
