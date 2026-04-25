// src/components/InsightsDashboard.jsx
import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Calendar, FileText, Filter } from 'lucide-react';

const InsightsDashboard = ({ documents = [], loading }) => {
  const [insightType, setInsightType] = useState('all');

  if (loading) {
    return (
      <div className="insights-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading insights...</p>
      </div>
    );
  }

  // ── Build insights from real document data ──────────────────────────────
  const allInsights = [];

  documents.forEach(doc => {
    const docName = doc.original_filename || doc.title || 'Unknown Document';
    const docDate = doc.processed_date || new Date().toISOString();

    // Action items → 'action' insights
    (doc.action_items || []).forEach(item => {
      allInsights.push({ type: 'action', text: item, priority: doc.priority || 'medium', documentName: docName, date: docDate });
    });

    // Key points → categorised by content
    (doc.key_points || []).slice(0, 2).forEach(point => {
      const type =
        /safety|hazard|incident|ppe/i.test(point) ? 'safety' :
        /compliance|audit|regulation|iso/i.test(point) ? 'compliance' :
        /deadline|due|by april|by may/i.test(point) ? 'deadline' :
        /cost|invoice|payment|amount/i.test(point) ? 'cost' : 'action';
      allInsights.push({ type, text: point, priority: doc.priority || 'low', documentName: docName, date: docDate });
    });

    // Explicit deadline → 'deadline' insight
    if (doc.deadline) {
      allInsights.push({
        type: 'deadline',
        text: `Deadline: ${doc.deadline}`,
        priority: 'high',
        documentName: docName,
        date: docDate,
      });
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

  // Real document type distribution
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

  return (
    <div className="insights-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>AI Insights Dashboard</h2>
          <p className="dashboard-subtitle">Intelligent analysis of your infrastructure documents</p>
        </div>
        <div className="header-actions">
          <div className="type-filter-header">
            <Filter size={16} />
            <span>{documents.length} document{documents.length !== 1 ? 's' : ''} analysed</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="insights-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Brain size={24} color="#1d4ed8" />
          </div>
          <div className="stat-content">
            <h3>Total Insights</h3>
            <p className="stat-number">{allInsights.length}</p>
            <p className="stat-trend">from {documents.length} documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <AlertTriangle size={24} color="#d97706" />
          </div>
          <div className="stat-content">
            <h3>High Priority</h3>
            <p className="stat-number">{highPriority.length}</p>
            <p className="stat-trend">{highPriority.length > 0 ? 'Require immediate attention' : 'None pending'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <Calendar size={24} color="#16a34a" />
          </div>
          <div className="stat-content">
            <h3>Upcoming Deadlines</h3>
            <p className="stat-number">{insightsByType.deadline.length}</p>
            <p className="stat-trend">{insightsByType.deadline.length > 0 ? 'View deadlines below' : 'No deadlines found'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e8ff' }}>
            <TrendingUp size={24} color="#7c3aed" />
          </div>
          <div className="stat-content">
            <h3>Action Items</h3>
            <p className="stat-number">{insightsByType.action.length}</p>
            <p className="stat-trend">across all departments</p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="insights-content">
        <div className="insights-main">
          <div className="section-header">
            <h3>Insights</h3>
            <div className="type-filter">
              {['all', 'safety', 'compliance', 'deadline', 'action'].map(type => (
                <button
                  key={type}
                  className={`type-btn ${insightType === type ? 'active' : ''}`}
                  onClick={() => setInsightType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== 'all' && (
                    <span className="type-count-badge"> {insightsByType[type]?.length || 0}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="insights-list">
            {filtered.length === 0 ? (
              <div className="no-insights">
                <Brain size={48} color="#d1d5db" />
                <p>
                  {documents.length === 0
                    ? 'No documents yet. Upload documents to see AI insights here.'
                    : 'No insights match this filter.'}
                </p>
              </div>
            ) : (
              filtered.map((insight, index) => (
                <div key={index} className="insight-card">
                  <div className="insight-header">
                    <div className={`priority-indicator ${insight.priority}`}></div>
                    <div className="insight-type">{insight.type}</div>
                    <div className="insight-document">
                      <FileText size={14} />
                      {insight.documentName.length > 35
                        ? insight.documentName.slice(0, 32) + '…'
                        : insight.documentName}
                    </div>
                  </div>
                  <div className="insight-text">
                    {insight.text.length > 180 ? insight.text.slice(0, 177) + '…' : insight.text}
                  </div>
                  <div className="insight-footer">
                    <span className="insight-date">{new Date(insight.date).toLocaleDateString()}</span>
                    <span className={`priority-badge ${insight.priority}`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="insights-sidebar">
          <div className="sidebar-section">
            <h4>Insights by Type</h4>
            <div className="type-distribution">
              {Object.entries(insightsByType).map(([type, insights]) => (
                <div key={type} className="type-item">
                  <div className="type-label">
                    <div className="type-color" style={{ backgroundColor: getTypeColor(type) }}></div>
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </div>
                  <div className="type-count">{insights.length}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Priority Breakdown</h4>
            <div className="priority-chart">
              {allInsights.length > 0 ? (
                <>
                  <div className="chart-bar high" style={{ width: `${(highPriority.length / allInsights.length) * 100 || 0}%` }}>
                    High ({highPriority.length})
                  </div>
                  <div className="chart-bar medium" style={{ width: `${(mediumPriority.length / allInsights.length) * 100 || 0}%` }}>
                    Medium ({mediumPriority.length})
                  </div>
                  <div className="chart-bar low" style={{ width: `${(lowPriority.length / allInsights.length) * 100 || 0}%` }}>
                    Low ({lowPriority.length})
                  </div>
                </>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No data yet</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Document Types</h4>
            <div className="doc-types">
              {sortedTypes.length > 0 ? (
                sortedTypes.slice(0, 5).map(([type, count]) => (
                  <div key={type} className="doc-type-item">
                    <span>{type}</span>
                    <span>{count} doc{count !== 1 ? 's' : ''}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No documents yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getTypeColor = (type) => ({
  safety: '#ef4444',
  compliance: '#3b82f6',
  deadline: '#f59e0b',
  cost: '#10b981',
  action: '#8b5cf6',
})[type] || '#6b7280';

export default InsightsDashboard;