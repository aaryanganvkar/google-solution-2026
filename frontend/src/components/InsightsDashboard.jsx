import React, { useState } from 'react';

const InsightsDashboard = ({ documents = [], loading }) => {
  const [insightType, setInsightType] = useState('all');

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Loading insights…</p>
        </div>
      </div>
    );
  }

  const allInsights = [];
  documents.forEach(doc => {
    const docName = doc.original_filename || doc.title || 'Unknown Document';
    const docDate = doc.processed_date || new Date().toISOString();

    (doc.action_items || []).forEach(item => {
      allInsights.push({ type: 'action', text: item, priority: doc.priority || 'medium', documentName: docName, date: docDate });
    });

    (doc.key_points || []).slice(0, 2).forEach(point => {
      const type =
        /safety|hazard|incident|ppe/i.test(point) ? 'safety' :
        /compliance|audit|regulation|iso/i.test(point) ? 'compliance' :
        /deadline|due|by april|by may/i.test(point) ? 'deadline' :
        /cost|invoice|payment|amount/i.test(point) ? 'cost' : 'action';
      allInsights.push({ type, text: point, priority: doc.priority || 'low', documentName: docName, date: docDate });
    });

    if (doc.deadline) {
      allInsights.push({ type: 'deadline', text: `Deadline: ${doc.deadline}`, priority: 'high', documentName: docName, date: docDate });
    }
  });

  const highPriority   = allInsights.filter(i => i.priority === 'high');
  const mediumPriority = allInsights.filter(i => i.priority === 'medium');
  const lowPriority    = allInsights.filter(i => i.priority === 'low');

  const insightsByType = {
    safety:     allInsights.filter(i => i.type === 'safety'),
    compliance: allInsights.filter(i => i.type === 'compliance'),
    deadline:   allInsights.filter(i => i.type === 'deadline'),
    cost:       allInsights.filter(i => i.type === 'cost'),
    action:     allInsights.filter(i => i.type === 'action'),
  };

  const docTypeCounts = {};
  documents.forEach(doc => {
    const t = (doc.document_type || 'unknown').replace(/_/g, ' ');
    docTypeCounts[t] = (docTypeCounts[t] || 0) + 1;
  });
  const sortedTypes = Object.entries(docTypeCounts).sort((a, b) => b[1] - a[1]);

  const filtered = allInsights
    .filter(i => insightType === 'all' || i.type === insightType)
    .sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.priority] - { high: 3, medium: 2, low: 1 }[a.priority]))
    .slice(0, 10);

  const typeConfig = {
    safety:     { icon: 'health_and_safety', color: 'text-red-600 bg-red-50 border border-red-200' },
    compliance: { icon: 'verified',           color: 'text-blue-600 bg-blue-50 border border-blue-200' },
    deadline:   { icon: 'calendar_today',     color: 'text-amber-600 bg-amber-50 border border-amber-200' },
    cost:       { icon: 'payments',           color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
    action:     { icon: 'task_alt',           color: 'text-purple-600 bg-purple-50 border border-purple-200' },
  };

  const priorityBadge = {
    high:   'text-red-700 bg-red-50 border border-red-200',
    medium: 'text-amber-700 bg-amber-50 border border-amber-200',
    low:    'text-emerald-700 bg-emerald-50 border border-emerald-200',
  };

  const stats = [
    { label: 'Total Insights',    value: allInsights.length,          icon: 'psychology',  sub: `from ${documents.length} documents` },
    { label: 'High Priority',     value: highPriority.length,         icon: 'warning',     sub: highPriority.length > 0 ? 'Require attention' : 'None pending' },
    { label: 'Deadlines',         value: insightsByType.deadline.length, icon: 'event',    sub: insightsByType.deadline.length > 0 ? 'Upcoming' : 'None found' },
    { label: 'Action Items',      value: insightsByType.action.length, icon: 'task_alt',   sub: 'Across all departments' },
  ];

  const filterTabs = [
    { key: 'all',        label: 'All',        count: allInsights.length },
    { key: 'safety',     label: 'Safety',     count: insightsByType.safety.length },
    { key: 'compliance', label: 'Compliance', count: insightsByType.compliance.length },
    { key: 'deadline',   label: 'Deadlines',  count: insightsByType.deadline.length },
    { key: 'action',     label: 'Actions',    count: insightsByType.action.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-h1 text-on-surface">AI Insights</h1>
        <p className="text-body-md text-on-surface-variant mt-0.5">
          Intelligent analysis of your infrastructure documents
        </p>
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
            <p className="text-[11px] text-on-surface-variant mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main + Sidebar */}
      <div className="flex gap-6">
        {/* Insights Panel */}
        <div className="flex-1 min-w-0">
          {/* Filter tabs */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-md mb-4">
            <div className="flex flex-wrap items-center gap-1">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setInsightType(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    insightType === tab.key
                      ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    insightType === tab.key ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]' : 'bg-surface-container text-on-surface-variant'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Insight cards */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-40">psychology</span>
              <h3 className="text-h3 font-h3 text-on-surface mb-1">No insights found</h3>
              <p className="text-body-md">
                {documents.length === 0
                  ? 'Upload documents to see AI insights here.'
                  : 'No insights match this filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((insight, index) => {
                const tc = typeConfig[insight.type] || typeConfig.action;
                const pb = priorityBadge[insight.priority] || priorityBadge.low;
                return (
                  <div key={index} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tc.color}`}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{tc.icon}</span>
                          {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${pb}`}>
                          {insight.priority.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant shrink-0">
                        {new Date(insight.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface mb-2">
                      {insight.text.length > 180 ? insight.text.slice(0, 177) + '…' : insight.text}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px]">description</span>
                      {insight.documentName.length > 50 ? insight.documentName.slice(0, 47) + '…' : insight.documentName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-60 shrink-0 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">By Type</p>
            <div className="space-y-2">
              {Object.entries(insightsByType).map(([type, items]) => {
                const tc = typeConfig[type] || typeConfig.action;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[12px] text-on-surface">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>{tc.icon}</span>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    <span className="text-[12px] font-semibold text-on-surface">{items.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Priority</p>
            {allInsights.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {[['High', highPriority.length, 'bg-red-400'], ['Medium', mediumPriority.length, 'bg-amber-400'], ['Low', lowPriority.length, 'bg-emerald-400']].map(([label, count, bar]) => (
                  <div key={label}>
                    <div className="flex justify-between text-[11px] text-on-surface-variant mb-1">
                      <span>{label}</span><span>{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bar}`} style={{ width: `${allInsights.length ? (count / allInsights.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Document Types</p>
            {sortedTypes.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant">No documents yet</p>
            ) : (
              <div className="space-y-1.5">
                {sortedTypes.slice(0, 5).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-[12px]">
                    <span className="text-on-surface truncate">{type}</span>
                    <span className="text-on-surface-variant shrink-0 ml-2">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
