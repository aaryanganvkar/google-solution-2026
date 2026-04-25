// src/components/KnowledgeBase.jsx
import React, { useState } from 'react';
import { Search, BookOpen, Folder, Tag, Users, Clock, Share2, Star, Filter, Download } from 'lucide-react';

const KnowledgeBase = ({ documents, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  if (loading) {
    return (
      <div className="knowledge-base loading">
        <div className="loading-spinner"></div>
        <p>Loading knowledge base...</p>
      </div>
    );
  }

  // Extract unique categories and tags from documents
  const categories = ['all', ...new Set(documents.map(doc => doc.category).filter(Boolean))];
  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags || [])));

  // Filter documents for knowledge base
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group documents by type for organization
  const documentsByType = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  return (
    <div className="knowledge-base">
      <div className="kb-header">
        <div className="header-main">
          <div className="header-icon">
            <BookOpen size={32} />
          </div>
          <div>
            <h2>Infrastructure Knowledge Base</h2>
            <p className="kb-subtitle">
              Central repository of analyzed documents, insights, and institutional knowledge
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="kb-action-btn">
            <Share2 size={16} />
            <span>Share Repository</span>
          </button>
          <button className="kb-action-btn">
            <Download size={16} />
            <span>Export Knowledge</span>
          </button>
        </div>
      </div>

      <div className="kb-search-section">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search knowledge base by keyword, tag, or document name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">Search</button>
        </div>
        
        <div className="view-controls">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="kb-filters">
        <div className="category-filters">
          <h4>Categories</h4>
          <div className="category-list">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                <Folder size={14} />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="tag-cloud">
          <h4>Popular Tags</h4>
          <div className="tags">
            {allTags.slice(0, 15).map(tag => (
              <button
                key={tag}
                className="tag-btn"
                onClick={() => setSearchQuery(tag)}
              >
                <Tag size={12} />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="kb-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <h3>{documents.length}</h3>
            <p>Documents</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div>
            <h3>{new Set(documents.map(d => d.uploadedBy)).size}</h3>
            <p>Contributors</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Tag size={20} />
          </div>
          <div>
            <h3>{allTags.length}</h3>
            <p>Unique Tags</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div>
            <h3>{documents.filter(d => d.status === 'processed').length}</h3>
            <p>AI Analyzed</p>
          </div>
        </div>
      </div>

      <div className="kb-content">
        {viewMode === 'grid' ? (
          <div className="documents-grid">
            {Object.entries(documentsByType).map(([type, docs]) => (
              <div key={type} className="document-category">
                <h3 className="category-title">
                  <Folder size={20} />
                  {type} ({docs.length})
                </h3>
                <div className="docs-grid">
                  {docs.map(doc => (
                    <div key={doc.id} className="kb-doc-card">
                      <div className="doc-header">
                        <div className="doc-icon">
                          <BookOpen size={20} />
                        </div>
                        <div className="doc-title">
                          <h4>{doc.name}</h4>
                          <div className="doc-meta">
                            <span className="doc-category">{doc.category}</span>
                            <span className="doc-date">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button className="star-btn">
                          <Star size={16} />
                        </button>
                      </div>
                      
                      <div className="doc-summary">
                        <p>{doc.summary.substring(0, 150)}...</p>
                      </div>
                      
                      <div className="doc-tags">
                        {doc.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="doc-footer">
                        <div className="doc-author">
                          <Users size={12} />
                          {doc.uploadedBy}
                        </div>
                        <div className="doc-ai-score">
                          AI Score: {doc.aiScore || 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="documents-list">
            <div className="list-header">
              <div className="header-col name">Document Name</div>
              <div className="header-col type">Type</div>
              <div className="header-col category">Category</div>
              <div className="header-col date">Uploaded</div>
              <div className="header-col score">AI Score</div>
              <div className="header-col actions">Actions</div>
            </div>
            
            {filteredDocs.map(doc => (
              <div key={doc.id} className="list-item">
                <div className="item-col name">
                  <BookOpen size={16} />
                  <div>
                    <h4>{doc.name}</h4>
                    <p className="item-summary">{doc.summary.substring(0, 80)}...</p>
                  </div>
                </div>
                <div className="item-col type">
                  <span className="type-badge">{doc.type}</span>
                </div>
                <div className="item-col category">{doc.category}</div>
                <div className="item-col date">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
                <div className="item-col score">
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${doc.aiScore || 0}%` }}
                    ></div>
                    <span>{doc.aiScore || 0}%</span>
                  </div>
                </div>
                <div className="item-col actions">
                  <button className="action-icon" title="View">
                    <BookOpen size={16} />
                  </button>
                  <button className="action-icon" title="Download">
                    <Download size={16} />
                  </button>
                  <button className="action-icon" title="Share">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredDocs.length === 0 && (
        <div className="empty-kb">
          <BookOpen size={48} />
          <h3>No documents found</h3>
          <p>Try adjusting your search criteria or select a different category</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;