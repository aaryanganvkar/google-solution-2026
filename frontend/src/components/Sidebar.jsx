import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ onLogout, userProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'department-dashboard', path: '/department-dashboard', icon: 'folder_shared', label: 'My Documents' },
    { id: 'library', path: '/library', icon: 'description', label: 'Document Library' },
    { id: 'insights', path: '/insights', icon: 'monitoring', label: 'AI Insights' },
    { id: 'knowledge', path: '/knowledge', icon: 'database', label: 'Knowledge Base' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('appState');
    if (onLogout) onLogout();
    else navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (userProfile?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] border-r border-slate-200 bg-slate-50 flex flex-col p-4 z-50">
      {/* Logo */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">DocIntel AI</h1>
          <p className="text-slate-500 text-xs">Document Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 active:scale-[0.98] text-sm ${
              isActive(item.path)
                ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] font-semibold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-200 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">{userProfile?.name || userProfile?.username || 'User'}</p>
          <p className="text-xs text-on-surface-variant truncate">{userProfile?.role || 'User'}</p>
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

export default Sidebar;
