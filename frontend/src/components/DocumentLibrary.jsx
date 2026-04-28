import React, { useState, useEffect } from 'react';

const DocumentLibrary = ({ user }) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [selectedDepartment, selectedType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      let headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'authenticated') {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (userData.username && userData.password) {
        const authString = btoa(`${userData.username}:${userData.password}`);
        headers['Authorization'] = `Basic ${authString}`;
      }
      const endpoint = (process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/documents';
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      if (selectedType !== 'all') params.append('category', selectedType);
      if (searchQuery) params.append('search', searchQuery);
      const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;
      const response = await fetch(url, { method: 'GET', headers });
      if (response.ok) {
        const data = await response.json();
        const formattedDocs = data.map(doc => ({
          id: doc.id,
          name: doc.title || doc.filename || 'Untitled Document',
          type: doc.category || doc.file_type || 'document',
          category: doc.category || 'general',
          size: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
          uploadedAt: doc.created_at || doc.uploaded_date || new Date().toISOString(),
          uploadedBy: doc.uploader_name || 'System',
          status: 'processed',
          summary: doc.description || 'No description available',
          insights: doc.insights || [{ type: 'info', text: 'Document stored in system', priority: 'low' }],
          processingTime: 'processed',
          tags: doc.tags ? doc.tags.split(',').map(tag => tag.trim()) : [],
          aiScore: 85,
          file_path: doc.file_path,
          department: doc.department,
          download_url: doc.download_url
        }));
        setDocuments(formattedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      fetchDepartmentDocuments();
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDocuments = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const department = userData.department || 'engineering';
      const endpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/processing/department-documents/${department}`;
      const authString = btoa(`${userData.username}:${userData.password}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedDocs = data.map(doc => ({
          id: doc.id || Math.random().toString(36).substr(2, 9),
          name: doc.original_filename || 'Document',
          type: doc.document_type || 'document',
          category: doc.document_type || 'general',
          size: doc.file_size || 'Unknown',
          uploadedAt: doc.processed_date || new Date().toISOString(),
          uploadedBy: doc.uploaded_by || 'System',
          status: doc.status || 'processed',
          summary: doc.summary || 'No summary available',
          insights: doc.key_points ? doc.key_points.map(point => ({ type: 'key_point', text: point, priority: doc.priority || 'medium' })) : [],
          processingTime: 'processed',
          tags: doc.tags || [doc.document_type],
          aiScore: 90,
          file_path: doc.file_path,
          department: doc.department,
          download_url: doc.s3_url,
          s3_key: doc.s3_key
        }));
        setDocuments(formattedDocs);
      }
    } catch (error) {
      console.error('Error fetching department documents:', error);
    }
  };

  const departments = ['all', ...new Set(documents.map(doc => doc.department).filter(Boolean))];
  const documentTypes = ['all', ...new Set(documents.map(doc => doc.type).filter(Boolean))];

  const filteredDocuments = documents
    .filter(doc => {
      if (filter === 'all') return true;
      if (filter === 'processed') return doc.status === 'processed';
      if (filter === 'high') return doc.insights?.some(i => i.priority === 'high') || doc.priority === 'high';
      return true;
    })
    .filter(doc => {
      if (selectedDepartment !== 'all' && doc.department !== selectedDepartment) return false;
      if (selectedType !== 'all' && doc.type !== selectedType) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(query) ||
        doc.summary.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case 'oldest': return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return (parseFloat(b.size) || 0) - (parseFloat(a.size) || 0);
        default: return 0;
      }
    });

  const handleViewDocument = async (doc) => {
    try {
      if (doc.s3_url) { window.open(doc.s3_url, '_blank'); return; }
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const authString = btoa(`${userData.username}:${userData.password}`);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/documents/${doc.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` }
      });
      setSelectedDocument(response.ok ? await response.json() : doc);
    } catch (error) {
      console.error('Error fetching document details:', error);
      setSelectedDocument(doc);
    }
  };

  const handleDownload = async (doc) => {
    try {
      if (doc.s3_url) { window.open(doc.s3_url, '_blank'); return; }
      if (doc.id) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const token = localStorage.getItem('userToken');
        let headers = { 'Content-Type': 'application/json' };
        if (token && token !== 'null' && token !== 'authenticated') {
          headers['Authorization'] = `Bearer ${token}`;
        } else if (userData.username && userData.password) {
          headers['Authorization'] = `Basic ${btoa(`${userData.username}:${userData.password}`)}`;
        }
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/documents/${doc.id}/download`, { method: 'GET', headers });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = doc.name || 'document';
          document.body.appendChild(a); a.click(); a.remove();
          window.URL.revokeObjectURL(url); return;
        }
      }
      alert('Download URL not available for this document');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      let headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'authenticated') {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (userData.username && userData.password) {
        headers['Authorization'] = `Basic ${btoa(`${userData.username}:${userData.password}`)}`;
      }
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/documents/${doc.id}`, { method: 'DELETE', headers });
      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== doc.id));
        alert('Document deleted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  const handleShare = (doc) => {
    const shareUrl = doc.s3_url || window.location.origin + `/document/${doc.id}`;
    if (navigator.share) {
      navigator.share({ title: doc.name, text: doc.summary, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Loading your documents…</p>
        </div>
      </div>
    );
  }

  const filterTabs = [
    { key: 'all', label: 'All', count: documents.length },
    { key: 'processed', label: 'Processed', count: documents.filter(d => d.status === 'processed').length },
    { key: 'high', label: 'High Priority', count: documents.filter(d => d.insights?.some(i => i.priority === 'high') || d.priority === 'high').length },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 font-h1 text-on-surface">Document Library</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            {documents.length} documents · {filteredDocuments.length} shown
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-on-primary px-md py-sm rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Controls bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-md mb-6 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search documents by name, content, or tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchDocuments()}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none"
          />
          <button
            onClick={fetchDocuments}
            className="text-xs font-medium text-primary hover:underline px-1"
          >
            Search
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-sm bg-surface-container rounded-lg border border-outline-variant px-3 py-1.5 text-on-surface outline-none cursor-pointer"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept.charAt(0).toUpperCase() + dept.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm bg-surface-container rounded-lg border border-outline-variant px-3 py-1.5 text-on-surface outline-none cursor-pointer"
          >
            {documentTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-surface-container rounded-lg border border-outline-variant px-3 py-1.5 text-on-surface outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">Size (Large→Small)</option>
          </select>

          <div className="flex items-center gap-1 ml-auto">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  filter === tab.key ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]' : 'bg-surface-container text-on-surface-variant'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document grid */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-4 opacity-40">description</span>
          <h3 className="text-h3 font-h3 text-on-surface mb-1">No documents found</h3>
          <p className="text-body-md mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={fetchDocuments}
            className="text-sm text-primary hover:underline font-medium"
          >
            Reload Documents
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col hover:shadow-md transition-shadow group">
              {/* Card top */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">description</span>
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  doc.status === 'processed'
                    ? 'bg-primary-fixed text-on-primary-fixed-variant'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[12px]" style={doc.status === 'processed' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {doc.status === 'processed' ? 'check_circle' : 'pending'}
                  </span>
                  {doc.status === 'processed' ? 'AI Analyzed' : 'Processing'}
                </span>
              </div>

              {/* Title + meta */}
              <h3 className="text-h3 font-h3 text-on-surface truncate mb-1" title={doc.name}>{doc.name}</h3>
              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mb-3">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
                {doc.department && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">business</span>
                    {doc.department}
                  </span>
                )}
              </div>

              {/* Summary */}
              <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3 flex-1">
                {doc.summary}
              </p>

              {/* Key points */}
              {doc.insights && doc.insights.length > 0 && (
                <div className="bg-surface p-md rounded-lg border border-outline-variant/50 mb-3 space-y-1">
                  {doc.insights.slice(0, 3).map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[12px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="line-clamp-1">{insight.text}</span>
                    </div>
                  ))}
                  {doc.insights.length > 3 && (
                    <p className="text-[11px] text-on-surface-variant pl-5">+{doc.insights.length - 3} more</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-outline-variant/50 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleViewDocument(doc)}
                  title="View Details"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  View
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  title="Download"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
                <button
                  onClick={() => handleShare(doc)}
                  title="Share"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(doc)}
                    title="Delete"
                    className="flex items-center justify-center p-1.5 rounded-lg text-xs text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-lg border-b border-outline-variant">
              <h3 className="text-h3 font-h3 text-on-surface truncate pr-4">
                {selectedDocument.title || selectedDocument.name || selectedDocument.filename || 'Document Details'}
              </h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-lg space-y-4">
              {[
                ['Description', selectedDocument.description || selectedDocument.summary || 'No description available'],
                ['Department', selectedDocument.department],
                ['Category', selectedDocument.category || selectedDocument.type || 'N/A'],
                ['File Type', selectedDocument.file_type || selectedDocument.type || 'Unknown'],
                ['Size', selectedDocument.file_size ? `${(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB` : selectedDocument.size || 'Unknown'],
                ['Uploaded', new Date(selectedDocument.created_at || selectedDocument.uploadedAt || new Date()).toLocaleDateString()],
                ['Uploaded By', selectedDocument.uploader_name || selectedDocument.uploadedBy || 'System'],
              ].map(([label, value]) => value && (
                <div key={label}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
                  <p className="text-body-md text-on-surface">{value}</p>
                </div>
              ))}
              {selectedDocument.tags && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant mb-1">Tags</p>
                  <p className="text-body-md text-on-surface">
                    {Array.isArray(selectedDocument.tags) ? selectedDocument.tags.join(', ') : selectedDocument.tags}
                  </p>
                </div>
              )}
              {selectedDocument.s3_url && (
                <a
                  href={selectedDocument.s3_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline font-medium pt-2 border-t border-outline-variant"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Open Original File
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
