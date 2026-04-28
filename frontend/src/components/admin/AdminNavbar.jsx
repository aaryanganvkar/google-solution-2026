import React from 'react';

const AdminNavbar = ({ activeTab }) => {
  const tabLabels = {
    dashboard: 'Dashboard',
    upload: 'Upload Documents',
    database: 'Document Database',
    users: 'User Management',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search */}
      <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 w-80">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
        <input
          type="text"
          placeholder="Search users, documents, logs…"
          className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none flex-1"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
          <span className="text-xs font-medium text-emerald-700">System Online</span>
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
        </button>

        <div className="w-px h-6 bg-outline-variant" />

        <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center text-xs font-semibold cursor-default">
          AD
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
