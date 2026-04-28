import React, { useState } from 'react';

const KnowledgeBase = ({ documents = [], loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Loading knowledge base…</p>
        </div>
      </div>
    );
  }

  const categories = ['all', ...new Set(documents.map(doc => doc.category).filter(Boolean))];
  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags || [])));
  const contributors = new Set(documents.map(d => d.uploadedBy).filter(Boolean)).size;
  const aiAnalyzed = documents.filter(d => d.status === 'processed').length;

  const filteredDocs = documents.filter(doc => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s ||
      (doc.name || '').toLowerCase().includes(s) ||
      (doc.summary || '').toLowerCase().includes(s) ||
      (doc.tags || []).some(tag => tag.toLowerCase().includes(s));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const documentsByType = filteredDocs.reduce((acc, doc) => {
    const type = doc.type || 'document';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  const stats = [
    { label: 'Total Documents', value: documents.length, icon: 'menu_book' },
    { label: 'Contributors',    value: contributors,      icon: 'group' },
    { label: 'Unique Tags',     value: allTags.length,    icon: 'label' },
    { label: 'AI Analyzed',     value: aiAnalyzed,        icon: 'psychology' },
  ];

  const filterTabs = categories.map(c => ({
    key: c,
    label: c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1),
    count: c === 'all' ? documents.length : documents.filter(d => d.category === c).length,
  }));

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 font-h1 text-on-surface">Knowledge Base</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Central repository of analysed documents and institutional knowledge
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-md py-sm rounded-lg text-sm font-medium bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">share</span>
            Share
          </button>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-md py-sm rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-lg mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{s.icon}</span>
              <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-md mb-6 space-y-3">
        <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search by keyword, tag, or document name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === tab.key
                    ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  selectedCategory === tab.key ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]' : 'bg-surface-container text-on-surface-variant'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[{ mode: 'grid', icon: 'grid_view' }, { mode: 'list', icon: 'view_list' }].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === mode ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-on-surface-variant font-medium">Tags:</span>
            {allTags.slice(0, 12).map(tag => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[11px]">label</span>
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-4 opacity-40">menu_book</span>
          <h3 className="text-h3 font-h3 text-on-surface mb-1">No documents found</h3>
          <p className="text-body-md">
            {documents.length === 0
              ? 'No documents available in the knowledge base yet.'
              : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          {Object.entries(documentsByType).map(([type, docs]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">folder</span>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {type} <span className="font-normal normal-case">({docs.length})</span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
                {docs.map(doc => (
                  <div key={doc.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">menu_book</span>
                      </div>
                      <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-[18px]">star_border</span>
                      </button>
                    </div>
                    <h3 className="text-h3 font-h3 text-on-surface truncate mb-1" title={doc.name}>{doc.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mb-3">
                      <span>{doc.category || 'general'}</span>
                      <span>·</span>
                      <span>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3 flex-1">{doc.summary || 'No summary available'}</p>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-medium">
                            <span className="material-symbols-outlined text-[10px]">label</span>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50">
                      <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[13px]">person</span>
                        {doc.uploadedBy || 'System'}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[{ icon: 'visibility', title: 'View' }, { icon: 'download', title: 'Download' }, { icon: 'share', title: 'Share' }].map(({ icon, title }) => (
                          <button key={icon} title={title} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[15px]">{icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-lg py-3 border-b border-outline-variant bg-surface-container">
            {['Document', 'Type', 'Category', 'Uploaded', 'Actions'].map((h, i) => (
              <div key={h} className={`${i === 0 ? 'col-span-5' : i === 4 ? 'col-span-1' : 'col-span-2'} text-[11px] font-medium uppercase tracking-wider text-on-surface-variant`}>{h}</div>
            ))}
          </div>
          {filteredDocs.map((doc, idx) => (
            <div key={doc.id} className={`grid grid-cols-12 gap-4 px-lg py-3 items-center hover:bg-surface-container transition-colors ${idx !== filteredDocs.length - 1 ? 'border-b border-outline-variant/50' : ''}`}>
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">menu_book</span>
                <div className="min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{doc.name}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{(doc.summary || '').slice(0, 55)}…</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">{doc.type || 'document'}</span>
              </div>
              <div className="col-span-2 text-[12px] text-on-surface-variant">{doc.category || '—'}</div>
              <div className="col-span-2 text-[12px] text-on-surface-variant">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</div>
              <div className="col-span-1 flex items-center gap-1">
                {[{ icon: 'visibility', title: 'View' }, { icon: 'download', title: 'Download' }].map(({ icon, title }) => (
                  <button key={icon} title={title} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
