# models.py
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user')
    department = db.Column(db.String(50), default='general')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    documents = db.relationship('Document', backref='uploader', lazy=True)
    processed_docs = db.relationship('ProcessedDocument', backref='processor', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'department': self.department,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    filename = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    file_type = db.Column(db.String(50))
    department = db.Column(db.String(50))
    category = db.Column(db.String(100))
    tags = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    views = db.Column(db.Integer, default=0)
    downloads = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'department': self.department,
            'category': self.category,
            'tags': self.tags,
            'status': self.status,
            'uploaded_by': self.uploaded_by,
            'views': self.views,
            'downloads': self.downloads,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Document {self.filename}>'

class ProcessedDocument(db.Model):
    __tablename__ = 'processed_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    original_filename = db.Column(db.String(200), nullable=False)
    processed_filename = db.Column(db.String(200))
    file_path = db.Column(db.String(500))
    document_type = db.Column(db.String(100))
    department = db.Column(db.String(50))
    summary = db.Column(db.Text)
    key_points = db.Column(db.Text)  # JSON string
    action_items = db.Column(db.Text)  # JSON string
    deadline = db.Column(db.String(50))
    priority = db.Column(db.String(20))
    doc_metadata = db.Column(db.Text)  # JSON string
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    processed_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='processed')
    
    def to_dict(self):
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'processed_filename': self.processed_filename,
            'file_path': self.file_path,
            'document_type': self.document_type,
            'department': self.department,
            'summary': self.summary,
            'key_points': json.loads(self.key_points) if self.key_points else [],
            'action_items': json.loads(self.action_items) if self.action_items else [],
            'deadline': self.deadline,
            'priority': self.priority,
            'metadata': json.loads(self.doc_metadata) if self.doc_metadata else {},
            'processed_by': self.processed_by,
            'processed_date': self.processed_date.isoformat() if self.processed_date else None,
            'status': self.status
        }
    
    def __repr__(self):
        return f'<ProcessedDocument {self.original_filename}>'