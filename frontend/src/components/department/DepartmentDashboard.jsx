// components/department/DepartmentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Calendar, CheckCircle, Download, Eye, Filter, Search, Clock, Users, Loader } from 'lucide-react';
import './DepartmentDashboard.css';

const DepartmentDashboard = ({ userProfile }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDepartmentDocuments = async () => {
    try {
      setLoading(true);
      
      if (!userProfile?.department) {
        console.error('No department specified');
        setLoading(false);
        return;
      }

      console.log(`Fetching documents for department: ${userProfile.department}`);
      
      // Try to get authentication token
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      let response;
      let endpoint = `http://localhost:5000/api/processing/department-documents/${userProfile.department}`;
      
      // Try multiple authentication methods
      if (token && token !== 'null') {
        // Method 1: Using Bearer token
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } else if (userData.username && userData.password) {
        // Method 2: Basic auth
        const authString = btoa(`${userData.username}:${userData.password}`);
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authString}`
          }
        });
      } else {
        // Method 3: Try without auth for development
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.length} documents from backend`);
        
        // Process and format the documents
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
          // Add tags based on document type
          tags: doc.document_type ? [doc.document_type.replace('_', ' ')] : ['document']
        }));
        
        setDocuments(formattedDocs);
      } else {
        console.error('Failed to fetch documents:', response.status, response.statusText);
        
        // Try to get error details
        try {
          const errorData = await response.text();
          console.error('Error response:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        // Fallback: Try to get documents from a different endpoint or show empty state
        console.log('Falling back to S3 direct listing');
        await fetchDocumentsFromS3Directly();
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      
      // Detailed error logging
      if (error.message.includes('Failed to fetch')) {
        console.error('Network error - make sure backend server is running on port 5000');
      }
      
      // Fallback to S3 direct listing
      await fetchDocumentsFromS3Directly();
    } finally {
      setLoading(false);
    }
  };

  // Fallback function to fetch directly from S3 via backend
  const fetchDocumentsFromS3Directly = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const endpoint = `http://localhost:5000/api/processing/list-s3-documents?department=${userProfile.department}`;
      
      const authString = btoa(`${userData.username}:${userData.password}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.documents?.length || 0} documents from S3`);
        
        // Format S3 documents
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
      // Use minimal mock data as last resort
      setDocuments(getMinimalMockDocuments(userProfile.department));
    }
  };

  // Minimal mock data as last resort
  const getMinimalMockDocuments = (department) => {
    return [{
      id: 1,
      original_filename: 'No documents found',
      document_type: 'info',
      department: department,
      summary: 'Unable to fetch documents from backend. Please check your connection.',
      key_points: ['Backend server may be down', 'Check network connection', 'Verify authentication'],
      action_items: ['Start backend server', 'Check API endpoint'],
      priority: 'high',
      deadline: null,
      processed_date: new Date().toISOString(),
      file_path: '',
      file_size: 'N/A',
      uploaded_by: 'System',
      tags: ['error', 'connection']
    }];
  };

  // Add this debugging function
  const debugBackendConnection = async () => {
    console.log('=== Debugging Backend Connection ===');
    console.log('Department:', userProfile?.department);
    console.log('User Data:', JSON.parse(localStorage.getItem('userData') || '{}'));
    console.log('Token:', localStorage.getItem('userToken'));
    
    const testEndpoints = [
      `http://localhost:5000/api/processing/department-documents/${userProfile?.department}`,
      'http://localhost:5000/api/auth/health',
      'http://localhost:5000/api/processing/test-connection'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint);
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error.message}`);
      }
    }
  };

  useEffect(() => {
    // Uncomment to debug connection issues
    // debugBackendConnection();
    
    if (userProfile?.department) {
      fetchDepartmentDocuments();
    } else {
      setLoading(false);
    }
  }, [userProfile?.department]);

  const filteredDocuments = documents.filter(doc => {
    // Apply filter
    if (filter === 'high') return doc.priority === 'high';
    if (filter === 'with-deadline') return doc.deadline;
    return true; // 'all' filter or no filter
  }).filter(doc => {
    // Apply search
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.original_filename.toLowerCase().includes(searchLower) ||
      doc.summary.toLowerCase().includes(searchLower) ||
      doc.document_type.toLowerCase().includes(searchLower) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return <AlertCircle size={16} className="priority-high-icon" />;
      case 'medium': return <Clock size={16} className="priority-medium-icon" />;
      case 'low': return <CheckCircle size={16} className="priority-low-icon" />;
      default: return <Clock size={16} />;
    }
  };

  const handleViewDocument = async (docId) => {
    try {
      // If it's an S3 document (starts with s3-), show S3 info
      if (docId.startsWith('s3-')) {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          openDocumentModal(doc);
        }
        return;
      }
      
      // For database documents, fetch details
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const token = localStorage.getItem('userToken');
      
      let headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (userData.username && userData.password) {
        const authString = btoa(`${userData.username}:${userData.password}`);
        headers['Authorization'] = `Basic ${authString}`;
      }
      
      const response = await fetch(`http://localhost:5000/api/processing/document/${docId}`, {
        method: 'GET',
        headers: headers
      });
      
      if (response.ok) {
        const document = await response.json();
        openDocumentModal(document);
      } else {
        // Fallback to local document data
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          openDocumentModal(doc);
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      // Fallback to local document data
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        openDocumentModal(doc);
      }
    }
  };

  const openDocumentModal = (document) => {
    const modalContent = `
      Document: ${document.original_filename}
      
      Status: ${document.status || 'processed'}
      Source: ${document.source || 'database'}
      
      Summary:
      ${document.summary}
      
      Document Type: ${document.document_type}
      Department: ${document.department}
      Priority: ${document.priority}
      ${document.deadline ? `Deadline: ${document.deadline}` : ''}
      
      Key Points:
      • ${document.key_points?.join('\n• ') || 'None'}
      
      Action Items:
      • ${document.action_items?.join('\n• ') || 'None'}
      
      ${document.s3_url ? `S3 URL: ${document.s3_url}` : ''}
    `;
    
    alert(modalContent);
  };

  const handleDownload = async (doc) => {
    try {
      // If document has S3 URL, use that
      if (doc.s3_url) {
        window.open(doc.s3_url, '_blank');
        return;
      }
      
      // Otherwise, try to get download URL from backend
      if (doc.id && !doc.id.startsWith('s3-')) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const token = localStorage.getItem('userToken');
        
        let headers = { 'Content-Type': 'application/json' };
        if (token && token !== 'null') {
          headers['Authorization'] = `Bearer ${token}`;
        } else if (userData.username && userData.password) {
          const authString = btoa(`${userData.username}:${userData.password}`);
          headers['Authorization'] = `Basic ${authString}`;
        }
        
        const response = await fetch(`http://localhost:5000/api/processing/download-document/${doc.id}`, {
          method: 'GET',
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.download_url) {
            window.open(data.download_url, '_blank');
            return;
          }
        }
      }
      
      // Fallback: Show message
      alert('Download URL not available for this document.');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleProcessDocument = async (doc) => {
    if (doc.s3_key) {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const response = await fetch('http://localhost:5000/api/processing/process-s3-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${userData.username}:${userData.password}`)}`
          },
          body: JSON.stringify({ s3_key: doc.s3_key })
        });
        
        if (response.ok) {
          alert('Document sent for processing! Refresh to see updated status.');
          fetchDepartmentDocuments(); // Refresh the list
        } else {
          alert('Failed to process document');
        }
      } catch (error) {
        console.error('Error processing document:', error);
        alert('Error processing document');
      }
    }
  };

  if (loading) {
    return (
      <div className="department-loading">
        <div className="loading-spinner"></div>
        <p>Loading department documents...</p>
      </div>
    );
  }

  const departmentName = userProfile?.department ? 
    userProfile.department.charAt(0).toUpperCase() + userProfile.department.slice(1) : 
    'Department';

  return (
    <div className="department-dashboard">
      <div className="department-header">
        <div className="department-title">
          <h2>{departmentName} Department Dashboard</h2>
          <p className="department-subtitle">
            {userProfile?.name ? `Welcome, ${userProfile.name}! ` : ''}
            Manage and access your department's processed documents
          </p>
        </div>
        <div className="department-stats">
          <div className="stat-card">
            <FileText size={24} className="stat-icon" />
            <div className="stat-content">
              <h3>Total Documents</h3>
              <p className="stat-number">{documents.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <AlertCircle size={24} className="stat-icon" />
            <div className="stat-content">
              <h3>High Priority</h3>
              <p className="stat-number">
                {documents.filter(doc => doc.priority === 'high').length}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <Calendar size={24} className="stat-icon" />
            <div className="stat-content">
              <h3>Processed</h3>
              <p className="stat-number">
                {documents.filter(doc => doc.status === 'processed').length}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <Users size={24} className="stat-icon" />
            <div className="stat-content">
              <h3>From S3</h3>
              <p className="stat-number">
                {documents.filter(doc => doc.source === 's3').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="department-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search documents by name, type, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Documents ({documents.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
            onClick={() => setFilter('high')}
          >
            High Priority ({documents.filter(d => d.priority === 'high').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'with-deadline' ? 'active' : ''}`}
            onClick={() => setFilter('with-deadline')}
          >
            With Deadlines ({documents.filter(d => d.deadline).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unprocessed' ? 'active' : ''}`}
            onClick={() => setFilter('unprocessed')}
          >
            Unprocessed ({documents.filter(d => d.status !== 'processed').length})
          </button>
        </div>
      </div>

      <div className="documents-list">
        {filteredDocuments.length === 0 ? (
          <div className="no-documents">
            <FileText size={48} className="no-docs-icon" />
            <h3>No documents found</h3>
            <p>{documents.length === 0 ? 
              `No documents have been processed for the ${departmentName} department yet.` : 
              'No documents match your search criteria.'}
            </p>
            {documents.length === 0 && (
              <button 
                className="refresh-btn"
                onClick={fetchDepartmentDocuments}
                style={{ marginTop: '1rem' }}
              >
                Check Again
              </button>
            )}
          </div>
        ) : (
          <div className="documents-grid">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-header">
                  <div className="document-type">
                    <FileText size={16} />
                    <span>{doc.document_type ? doc.document_type.replace('_', ' ') : 'Document'}</span>
                    {doc.source === 's3' && (
                      <span className="s3-badge">S3</span>
                    )}
                  </div>
                  <div className={`priority-badge ${getPriorityColor(doc.priority)}`}>
                    {getPriorityIcon(doc.priority)}
                    <span>{doc.priority ? doc.priority.toUpperCase() : 'NORMAL'}</span>
                  </div>
                </div>
                
                <div className="document-content">
                  <h3 className="document-title">{doc.original_filename}</h3>
                  
                  <div className="document-status">
                    <span className={`status-badge status-${doc.status || 'processed'}`}>
                      {doc.status || 'processed'}
                    </span>
                  </div>
                  
                  <p className="document-summary">
                    {doc.summary
                      ? (doc.summary.length > 160 ? doc.summary.slice(0, 157) + '…' : doc.summary)
                      : 'No summary available'}
                  </p>

                  {doc.deadline && (
                    <div className="deadline-info">
                      <Calendar size={14} />
                      <span>Deadline: {doc.deadline}</span>
                    </div>
                  )}

                  {doc.key_points && doc.key_points.length > 0 && (
                    <div className="key-points">
                      <h4>Key Points:</h4>
                      <ul>
                        {doc.key_points.slice(0, 3).map((point, idx) => (
                          <li key={idx}>
                            {typeof point === 'string' && point.length > 100
                              ? point.slice(0, 97) + '…'
                              : point}
                          </li>
                        ))}
                        {doc.key_points.length > 3 && (
                          <li className="more-points">+{doc.key_points.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className="document-meta">
                    <span className="meta-item">
                      <Users size={12} />
                      {doc.uploaded_by}
                    </span>
                    <span className="meta-item">
                      {doc.file_size}
                    </span>
                    <span className="meta-item">
                      {doc.processed_date ? new Date(doc.processed_date).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
                
                <div className="document-actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleViewDocument(doc.id)}
                    title="View document details"
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                  
                  {doc.status === 'processed' || doc.s3_url ? (
                    <button 
                      className="action-btn download-btn"
                      onClick={() => handleDownload(doc)}
                      title="Download document"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                  ) : (
                    <button 
                      className="action-btn process-btn"
                      onClick={() => handleProcessDocument(doc)}
                      title="Process with AI"
                    >
                      <FileText size={16} />
                      <span>Process</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="dashboard-footer">
        <p className="last-updated">
          Last updated: {new Date().toLocaleTimeString()} | 
          Showing {filteredDocuments.length} of {documents.length} documents
        </p>
        <div className="footer-actions">
          <button
            className="refresh-btn"
            onClick={fetchDepartmentDocuments}
            disabled={loading}
          >
            {loading ? <Loader size={16} className="spin" /> : 'Refresh Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;