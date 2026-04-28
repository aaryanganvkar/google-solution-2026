import React, { useState } from 'react';
import axios from 'axios';

const AdminUploadS3 = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [processingResults, setProcessingResults] = useState(null);

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      file: file,
      status: 'pending',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const newFiles = Array.from(e.dataTransfer.files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      file: file,
      status: 'pending',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const removeFile = (id) => setFiles(files.filter(f => f.id !== id));

  const getUserCredentials = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return { username: userData.username || 'admin', password: userData.password || 'admin123' };
  };

  const uploadFileToS3 = async (file) => {
    const formData = new FormData();
    formData.append('file', file.file);
    formData.append('title', file.name);
    formData.append('description', `Uploaded via Admin Dashboard - ${new Date().toLocaleString()}`);
    const token = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    formData.append('username', userData.username || 'admin');
    formData.append('password', userData.password || 'admin123');
    try {
      const response = await axios.post((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/upload-s3', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && token !== 'authenticated' && { 'Authorization': `Bearer ${token}` })
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress, status: 'uploading' } : f));
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const retry = await axios.post((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/upload-s3', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          return { success: true, data: retry.data };
        } catch (e) { error = e; }
      }
      return { success: false, error: error.response?.data?.error || error.message || 'Upload failed' };
    }
  };

  const triggerLLMProcessing = async () => {
    try {
      const credentials = getUserCredentials();
      const response = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api/processing/trigger-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (response.ok) {
        const results = await response.json();
        setProcessingResults(results.result);
        return results;
      }
    } catch (error) {
      console.error('Processing error:', error);
    }
    return null;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadStatus('Starting upload to Google Cloud Storage…');
    const results = [];
    for (const file of files) {
      setUploadStatus(`Uploading: ${file.name}`);
      const result = await uploadFileToS3(file);
      results.push(result);
      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? { ...f, status: result.success ? 'success' : 'error', progress: result.success ? 100 : f.progress, error: result.error }
          : f
      ));
    }
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    if (successCount > 0) {
      setUploadStatus(`Upload complete! ${successCount} files uploaded. Starting AI processing…`);
      const processed = await triggerLLMProcessing();
      setUploadStatus(processed
        ? 'AI processing complete! Documents analyzed and routed to departments.'
        : 'Upload complete but AI processing failed. Documents are in Google Cloud Storage but not processed.'
      );
    } else {
      setUploadStatus(`Upload failed: ${failCount} errors`);
    }
    setUploading(false);
    if (failCount === 0) {
      setTimeout(() => { setFiles([]); setUploadStatus(''); }, 8000);
    }
  };

  const statusIcon = (status) => {
    if (status === 'success') return <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
    if (status === 'error') return <span className="material-symbols-outlined text-[16px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>;
    if (status === 'uploading') return <span className="material-symbols-outlined text-[16px] text-primary animate-spin">progress_activity</span>;
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-h1 text-on-surface">Upload Documents</h1>
        <p className="text-body-md text-on-surface-variant mt-0.5">
          Upload to Google Cloud Storage — AI will automatically analyze, categorize, and route documents to departments
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary-fixed/40 border border-primary-fixed rounded-xl p-md mb-6">
        <span className="material-symbols-outlined text-[20px] text-on-primary-fixed-variant flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        <div>
          <p className="text-sm font-medium text-on-surface">AI-Powered Processing</p>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            The system will automatically extract metadata, categorize documents, determine priority, and route to correct departments.
          </p>
        </div>
      </div>

      {/* Upload card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl mb-6">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-container bg-primary-fixed/20'
              : 'border-outline-variant bg-surface-container-low/50 hover:border-primary-container hover:bg-primary-fixed/10'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('s3-file-input').click()}
        >
          <input
            id="s3-file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
          />
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">cloud_upload</span>
          <p className="text-base font-semibold text-on-surface mb-1">Drop files here or click to browse</p>
          <p className="text-body-sm text-on-surface-variant mb-4">Supports PDF, DOCX, XLSX, PPT, Images</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-[11px] font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">upload</span>
              Max 50 MB
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-[11px] font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Encrypted
            </span>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-on-surface mb-3">Selected Files ({files.length})</p>
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0">
                    {file.type.includes('pdf') ? 'picture_as_pdf' : file.type.includes('image') ? 'image' : 'description'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{file.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{file.size}</p>
                    {file.status === 'uploading' && (
                      <div className="mt-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${file.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusIcon(file.status)}
                    {file.status === 'uploading' && (
                      <span className="text-[11px] text-primary font-medium">{file.progress}%</span>
                    )}
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        disabled={uploading}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button + status */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Uploading & Processing…</>
              : <><span className="material-symbols-outlined text-[18px]">cloud_upload</span> Upload & Process {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}</>
            }
          </button>

          {uploadStatus && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              uploading
                ? 'bg-primary-fixed/30 text-on-primary-fixed-variant'
                : uploadStatus.includes('complete')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-error-container text-on-error-container'
            }`}>
              <span className="material-symbols-outlined text-[16px]">
                {uploading ? 'hourglass_top' : uploadStatus.includes('complete') ? 'check_circle' : 'info'}
              </span>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>

      {/* Processing results */}
      {processingResults && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
          <h2 className="text-h2 font-h2 text-on-surface mb-4">AI Processing Results</h2>
          <div className="grid grid-cols-3 gap-lg mb-6">
            {[
              { label: 'Total Processed', value: processingResults.summary?.total_processed || 0, icon: 'description' },
              { label: 'Departments', value: Object.keys(processingResults.summary?.by_department || {}).length, icon: 'business' },
              { label: 'Avg Time', value: '~3-5s/doc', icon: 'schedule' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-container p-md rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{stat.icon}</span>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
              </div>
            ))}
          </div>

          {Object.keys(processingResults.summary?.by_department || {}).length > 0 && (
            <div>
              <p className="text-sm font-medium text-on-surface mb-3">Documents by Department</p>
              <div className="space-y-2">
                {Object.entries(processingResults.summary.by_department).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                    <span className="text-sm text-on-surface font-medium capitalize">{dept}</span>
                    <span className="text-sm text-on-surface-variant">{count} documents</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUploadS3;
