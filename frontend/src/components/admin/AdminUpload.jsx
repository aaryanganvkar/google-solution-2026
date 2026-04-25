// components/admin/AdminUpload.jsx
import React, { useState } from 'react';
import { Upload, X, File, Folder, Eye, EyeOff, Users } from 'lucide-react';
import apiClient from '../api/apiClient';

const AdminUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSettings, setUploadSettings] = useState({
    autoProcess: true,
    visibility: 'private',
    category: 'engineering',
    notifyUsers: false
  });

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      status: 'pending'
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = droppedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      status: 'pending'
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const handleUpload = () => {
    // Simulate upload
    setFiles(files.map(file => ({
      ...file,
      status: 'uploading'
    })));
    
    setTimeout(() => {
      setFiles(files.map(file => ({
        ...file,
        status: 'uploaded'
      })));
      alert('Files uploaded successfully!');
    }, 2000);
  };

  const handleSettingChange = (key, value) => {
    setUploadSettings({
      ...uploadSettings,
      [key]: value
    });
  };

  return (
    <div className="admin-upload">
      <div className="admin-upload-header">
        <h2>Upload Documents</h2>
        <p className="upload-subtitle">Upload and manage infrastructure documents for AI processing</p>
      </div>

      <div className="upload-content">
        <div>
          <div 
            className={`admin-upload-dropzone ${isDragging ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              className="upload-input"
              onChange={handleFileSelect}
            />
            <Upload size={48} style={{ color: '#6b7280', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: '#1f2937' }}>Drop files here or click to browse</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Supports PDF, DOCX, JPG, PNG up to 100MB each
            </p>
          </div>

          {files.length > 0 && (
            <div className="admin-files-list">
              <h4>Selected Files ({files.length})</h4>
              <div className="admin-files-grid">
                {files.map(file => (
                  <div key={file.id} className="admin-file-item">
                    <File size={20} className="file-icon" />
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.size}</span>
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: file.status === 'uploaded' ? '#10b981' : 
                             file.status === 'uploading' ? '#f59e0b' : '#6b7280'
                    }}>
                      {file.status}
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFile(file.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="admin-upload-actions">
            <button 
              className="admin-upload-btn"
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              Upload Documents
            </button>
            <div className="upload-info">
              <Folder size={16} />
              <span>Documents will be stored in: /uploads/{new Date().toISOString().split('T')[0]}/</span>
            </div>
          </div>
        </div>

        <div className="upload-settings">
          <h3>Upload Settings</h3>
          
          <div className="setting-group">
            <h4>Processing Options</h4>
            <label className="setting-label">
              <input
                type="checkbox"
                checked={uploadSettings.autoProcess}
                onChange={(e) => handleSettingChange('autoProcess', e.target.checked)}
              />
              <span>Enable AI auto-processing</span>
            </label>
            <label className="setting-label">
              <input
                type="checkbox"
                checked={uploadSettings.notifyUsers}
                onChange={(e) => handleSettingChange('notifyUsers', e.target.checked)}
              />
              <span>Notify relevant users</span>
            </label>
          </div>

          <div className="setting-group">
            <h4>Document Visibility</h4>
            <div className="visibility-options">
              <label className={`visibility-option ${uploadSettings.visibility === 'public' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={uploadSettings.visibility === 'public'}
                  onChange={(e) => handleSettingChange('visibility', e.target.value)}
                />
                <Eye size={16} />
                <span>Public (All users)</span>
              </label>
              <label className={`visibility-option ${uploadSettings.visibility === 'private' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={uploadSettings.visibility === 'private'}
                  onChange={(e) => handleSettingChange('visibility', e.target.value)}
                />
                <EyeOff size={16} />
                <span>Private (Admin only)</span>
              </label>
              <label className={`visibility-option ${uploadSettings.visibility === 'restricted' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  value="restricted"
                  checked={uploadSettings.visibility === 'restricted'}
                  onChange={(e) => handleSettingChange('visibility', e.target.value)}
                />
                <Users size={16} />
                <span>Restricted (Selected users)</span>
              </label>
            </div>
          </div>

          <div className="setting-group">
            <h4>Category</h4>
            <select 
              className="category-select"
              value={uploadSettings.category}
              onChange={(e) => handleSettingChange('category', e.target.value)}
            >
              <option value="engineering">Engineering</option>
              <option value="compliance">Compliance</option>
              <option value="safety">Safety Audit</option>
              <option value="maintenance">Maintenance</option>
              <option value="planning">Planning</option>
            </select>
          </div>

          <div className="setting-summary">
            <h4>Upload Summary</h4>
            <ul>
              <li>• Files will be automatically categorized</li>
              <li>• AI will extract key insights</li>
              <li>• Processing time: ~2-5 seconds per document</li>
              <li>• Original files are preserved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;