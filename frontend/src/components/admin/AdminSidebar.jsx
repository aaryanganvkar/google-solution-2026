import React from 'react';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'upload', icon: 'upload_file', label: 'Upload Documents' },
    { id: 'database', icon: 'database', label: 'Document Database' },
    { id: 'users', icon: 'group', label: 'User Management' },
    { id: 'analytics', icon: 'monitoring', label: 'Analytics' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] border-r border-slate-200 bg-slate-50 flex flex-col p-4 z-50">
      {/* Logo */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">DocIntel AI</h1>
          <p className="text-slate-500 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 active:scale-[0.98] text-sm ${
              activeTab === item.id
                ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] font-semibold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-200 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center text-xs font-semibold flex-shrink-0">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">Administrator</p>
          <p className="text-xs text-on-surface-variant truncate">Super Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-error transition-colors flex-shrink-0"
          title="Logout"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
