// components/DocumentUpload.jsx
import React, { useState } from 'react';
import './DocumentUpload.css';
import { Upload, File, X, AlertCircle } from 'lucide-react';

const DocumentUpload = ({ onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => 
      file.type === 'application/pdf' || 
      file.type.includes('image/') || 
      file.type.includes('text/') ||
      file.type.includes('application/msword') ||
      file.type.includes('application/vnd.openxmlformats-officedocument')
    );

    const processedFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
      file: file,
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...processedFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload and AI processing
    setTimeout(() => {
      onUploadComplete(files);
      setFiles([]);
      setUploading(false);
    }, 1500);
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h2>Upload Documents</h2>
        <p className="upload-subtitle">
          Upload infrastructure documents for AI-powered analysis and summarization
        </p>
      </div>

      <div 
        className={`upload-dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.bmp"
          className="upload-input"
        />
        
        <div className="dropzone-content">
          <Upload size={48} className="upload-icon" />
          <div className="dropzone-text">
            <h3>Drag & drop files here</h3>
            <p>or click to browse</p>
            <p className="file-types">Supports: PDF, DOC, DOCX, TXT, Images</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <h4>Selected Files ({files.length})</h4>
          <div className="files-grid">
            {files.map(file => (
              <div key={file.id} className="file-item">
                <File className="file-icon" />
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{file.size}</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeFile(file.id)}
                  disabled={uploading}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="upload-actions">
        <button 
          className="upload-btn"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? 'Processing...' : `Upload & Process ${files.length} Files`}
        </button>
        
        <div className="upload-info">
          <AlertCircle size={16} />
          <span>Documents will be analyzed using Gemini AI for summarization and insights</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;