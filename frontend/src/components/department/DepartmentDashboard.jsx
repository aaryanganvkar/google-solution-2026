import React, { useState, useEffect } from 'react';

const DepartmentDashboard = ({ userProfile }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDepartmentDocuments = async () => {
    try {
      setLoading(true);
      if (!userProfile?.department) { setLoading(false); return; }
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const endpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/processing/department-documents/${userProfile.department}`;
      let response;
      if (token && token !== 'null') {
        response = await fetch(endpoint, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      } else if (userData.username && userData.password) {
        response = await fetch(endpoint, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(`${userData.username}:${userData.password}`)}` } });
      } else {
        response = await fetch(endpoint, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      }
      if (response.ok) {
        const data = await response.json();
        const formattedDocs = data.map(doc => ({
          id: doc.id || `s3-${doc.original_filename?.replace(/[^a-zA-Z0-9]/g, '-')}`,
          original_filename: doc.original_filename || 'Unknown Document',
          document_type: doc.document_type || 'unknown',
          department: doc.department || userProfile.department,
          summary: doc.summary || 'No summary available',
          key_points: doc.key_points || [],
          action_items: doc.action_items || [],
          priority: doc.priority || 'medium',
          deadline: doc.deadline || null,
          processed_date: doc.processed_date || new Date().toISOString(),
          file_path: doc.file_path || doc.s3_url || '',
          file_size: doc.file_size || 'Unknown',
          uploaded_by: doc.uploaded_by || 'System',
          status: doc.status || 'processed',
          source: doc.source || 'database',
          s3_url: doc.s3_url || null,
          s3_key: doc.s3_key || null,
          tags: doc.document_type ? [doc.document_type.replace('_', ' ')] : ['document']
        }));
        setDocuments(formattedDocs);
      } else {
        await fetchDocumentsFromS3Directly();
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      await fetchDocumentsFromS3Directly();
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentsFromS3Directly = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const endpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/processing/list-s3-documents?department=${userProfile.department}`;
      const authString = btoa(`${userData.username}:${userData.password}`);
      const response = await fetch(endpoint, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` } });
      if (response.ok) {
        const data = await response.json();
        const s3Docs = data.documents?.map(doc => ({
          id: `s3-${doc.key?.replace(/[^a-zA-Z0-9]/g, '-')}`,
          original_filename: doc.key ? doc.key.split('/').pop() : 'S3 Document',
          document_type: doc.document_type || 's3_document',
          department: doc.department || userProfile.department,
          summary: `S3 document stored at ${doc.key}. Not yet processed by AI.`,
          key_points: ['Document is in S3 storage', 'Pending AI processing'],
          action_items: ['Run AI processing on this document'],
          priority: 'medium',
          deadline: null,
          processed_date: doc.last_modified || new Date().toISOString(),
          file_path: doc.url || '',
          file_size: doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
          uploaded_by: 'S3 Upload',
          status: 'in_s3',
          source: 's3',
          s3_url: doc.url,
          s3_key: doc.key,
          tags: ['s3', 'unprocessed']
        })) || [];
        setDocuments(s3Docs);
      }
    } catch (error) {
      console.error('Failed to fetch from S3:', error);
      setDocuments(getMinimalMockDocuments(userProfile.department));
    }
  };

  const getMinimalMockDocuments = (department) => [{
    id: 1, original_filename: 'No documents found', document_type: 'info', department,
    summary: 'Unable to fetch documents from backend. Please check your connection.',
    key_points: ['Backend server may be down', 'Check network connection', 'Verify authentication'],
    action_items: ['Start backend server', 'Check API endpoint'],
    priority: 'high', deadline: null, processed_date: new Date().toISOString(),
    file_path: '', file_size: 'N/A', uploaded_by: 'System', tags: ['error', 'connection']
  }];

  useEffect(() => {
    if (userProfile?.department) fetchDepartmentDocuments();
    else setLoading(false);
  }, [userProfile?.department]);

  const filteredDocuments = documents
    .filter(doc => {
      if (filter === 'high') return doc.priority === 'high';
      if (filter === 'with-deadline') return doc.deadline;
      if (filter === 'unprocessed') return doc.status !== 'processed';
      return true;
    })
    .filter(doc => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        doc.original_filename.toLowerCase().includes(s) ||
        doc.summary.toLowerCase().includes(s) ||
        doc.document_type.toLowerCase().includes(s) ||
        (doc.tags && doc.tags.some(t => t.toLowerCase().includes(s)))
      );
    });

  const handleViewDocument = async (docId) => {
    if (typeof docId === 'string' && docId.startsWith('s3-')) {
      const doc = documents.find(d => d.id === docId);
      if (doc) openDocumentModal(doc);
      return;
    }
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const token = localStorage.getItem('userToken');
      let headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      else if (userData.username && userData.password) headers['Authorization'] = `Basic ${btoa(`${userData.username}:${userData.password}`)}`;
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/processing/document/${docId}`, { method: 'GET', headers });
      const doc = response.ok ? await response.json() : documents.find(d => d.id === docId);
      if (doc) openDocumentModal(doc);
    } catch (error) {
      console.error('Error viewing document:', error);
      const doc = documents.find(d => d.id === docId);
      if (doc) openDocumentModal(doc);
    }
  };

  const openDocumentModal = (document) => {
    const modalContent = `Document: ${document.original_filename}\n\nStatus: ${document.status || 'processed'}\nSource: ${document.source || 'database'}\n\nSummary:\n${document.summary}\n\nDocument Type: ${document.document_type}\nDepartment: ${document.department}\nPriority: ${document.priority}\n${document.deadline ? `Deadline: ${document.deadline}` : ''}\n\nKey Points:\n• ${document.key_points?.join('\n• ') || 'None'}\n\nAction Items:\n• ${document.action_items?.join('\n• ') || 'None'}\n\n${document.s3_url ? `S3 URL: ${document.s3_url}` : ''}`;
    alert(modalContent);
  };

  const handleDownload = async (doc) => {
    try {
      if (doc.s3_url) { window.open(doc.s3_url, '_blank'); return; }
      if (doc.id && !doc.id.toString().startsWith('s3-')) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const token = localStorage.getItem('userToken');
        let headers = { 'Content-Type': 'application/json' };
        if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
        else if (userData.username && userData.password) headers['Authorization'] = `Basic ${btoa(`${userData.username}:${userData.password}`)}`;
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/processing/download-document/${doc.id}`, { method: 'GET', headers });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = doc.original_filename || 'document';
          document.body.appendChild(a); a.click(); a.remove();
          window.URL.revokeObjectURL(url); return;
        }
      }
      alert('Download URL not available for this document.');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleProcessDocument = async (doc) => {
    if (!doc.s3_key) return;
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const response = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/processing/process-s3-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(`${userData.username}:${userData.password}`)}` },
        body: JSON.stringify({ s3_key: doc.s3_key })
      });
      if (response.ok) {
        alert('Document sent for processing! Refresh to see updated status.');
        fetchDepartmentDocuments();
      } else {
        alert('Failed to process document');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document');
    }
  };

  const priorityConfig = {
    high: { color: 'text-error bg-error-container', icon: 'error' },
    medium: { color: 'text-amber-700 bg-amber-50 border border-amber-200', icon: 'schedule' },
    low: { color: 'text-emerald-700 bg-emerald-50 border border-emerald-200', icon: 'check_circle' },
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Loading department documents…</p>
        </div>
      </div>
    );
  }

  const departmentName = userProfile?.department
    ? userProfile.department.charAt(0).toUpperCase() + userProfile.department.slice(1)
    : 'Department';

  const filterTabs = [
    { key: 'all', label: 'All Documents', count: documents.length },
    { key: 'high', label: 'High Priority', count: documents.filter(d => d.priority === 'high').length },
    { key: 'with-deadline', label: 'With Deadlines', count: documents.filter(d => d.deadline).length },
    { key: 'unprocessed', label: 'Unprocessed', count: documents.filter(d => d.status !== 'processed').length },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-h1 text-on-surface">{departmentName} Dashboard</h1>
        <p className="text-body-md text-on-surface-variant mt-0.5">
          {userProfile?.name ? `Welcome, ${userProfile.name}! ` : ''}
          Manage and access your department's processed documents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-lg mb-6">
        {[
          { label: 'Total Documents', value: documents.length, icon: 'description' },
          { label: 'High Priority', value: documents.filter(d => d.priority === 'high').length, icon: 'priority_high' },
          { label: 'Processed', value: documents.filter(d => d.status === 'processed').length, icon: 'check_circle' },
          { label: 'From S3', value: documents.filter(d => d.source === 's3').length, icon: 'cloud' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{stat.icon}</span>
              <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-md mb-6 space-y-3">
        <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search documents by name, type, or content…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
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

      {/* Documents */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-4 opacity-40">folder_open</span>
          <h3 className="text-h3 font-h3 text-on-surface mb-1">No documents found</h3>
          <p className="text-body-md mb-4">
            {documents.length === 0
              ? `No documents have been processed for the ${departmentName} department yet.`
              : 'No documents match your search criteria.'}
          </p>
          {documents.length === 0 && (
            <button onClick={fetchDepartmentDocuments} className="text-sm text-primary hover:underline font-medium">
              Check Again
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {filteredDocuments.map((doc) => {
            const pc = priorityConfig[doc.priority] || priorityConfig.medium;
            return (
              <div key={doc.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col hover:shadow-md transition-shadow group">
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {doc.document_type ? doc.document_type.replace('_', ' ') : 'Document'}
                    </span>
                    {doc.source === 's3' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-[10px] font-semibold text-on-surface-variant">S3</span>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${pc.color}`}>
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{pc.icon}</span>
                    {(doc.priority || 'medium').toUpperCase()}
                  </span>
                </div>

                <h3 className="text-h3 font-h3 text-on-surface truncate mb-1" title={doc.original_filename}>
                  {doc.original_filename}
                </h3>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    doc.status === 'processed'
                      ? 'bg-primary-fixed text-on-primary-fixed-variant'
                      : 'bg-surface-variant text-on-surface-variant'
                  }`}>{doc.status || 'processed'}</span>
                </div>

                <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3 flex-1">
                  {doc.summary ? (doc.summary.length > 160 ? doc.summary.slice(0, 157) + '…' : doc.summary) : 'No summary available'}
                </p>

                {doc.deadline && (
                  <div className="flex items-center gap-1.5 text-[12px] text-amber-700 mb-3">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Deadline: {doc.deadline}
                  </div>
                )}

                {doc.key_points && doc.key_points.length > 0 && (
                  <div className="bg-surface p-md rounded-lg border border-outline-variant/50 mb-3 space-y-1">
                    {doc.key_points.slice(0, 3).map((point, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[12px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="line-clamp-1">{typeof point === 'string' && point.length > 100 ? point.slice(0, 97) + '…' : point}</span>
                      </div>
                    ))}
                    {doc.key_points.length > 3 && <p className="text-[11px] text-on-surface-variant pl-5">+{doc.key_points.length - 3} more</p>}
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mb-3">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                    {doc.uploaded_by}
                  </span>
                  <span>{doc.file_size}</span>
                  <span>{doc.processed_date ? new Date(doc.processed_date).toLocaleDateString() : 'Recent'}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/50">
                  <button
                    onClick={() => handleViewDocument(doc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Details
                  </button>
                  {(doc.status === 'processed' || doc.s3_url) ? (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Download
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProcessDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      Process
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-outline-variant text-body-sm text-on-surface-variant">
        <p>Last updated: {new Date().toLocaleTimeString()} · Showing {filteredDocuments.length} of {documents.length} documents</p>
        <button
          onClick={fetchDepartmentDocuments}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
