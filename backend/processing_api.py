# processing_api.py
from flask import Blueprint, request, jsonify
import os
import uuid
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from models import db, User, Document, ProcessedDocument
from model import (
    batch_process_s3_documents, 
    auto_fetch_and_process,
    process_s3_document,
    list_s3_documents,
    download_from_s3,
    DocumentProcessingResult
)
import jwt

processing_bp = Blueprint('processing', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'infradoc-ai-secret-jwt-key-2024')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def authenticate_user_from_request():
    """Extract and authenticate user from request using JWT or credentials"""
    # Method 1: Try JWT token
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if payload:
            user = User.query.get(payload['user_id'])
            if user and user.is_active:
                return user
    
    # Method 2: Try credentials from various sources
    username = None
    password = None
    
    # Try JSON body
    data = request.get_json(silent=True)
    if data:
        username = data.get('username')
        password = data.get('password')
    
    # Try form data
    if not username or not password:
        username = request.form.get('username')
        password = request.form.get('password')
    
    # Try query parameters
    if not username or not password:
        username = request.args.get('username')
        password = request.args.get('password')
    
    if not username or not password:
        return None
    
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return None
    
    if not user.is_active:
        return None
    
    return user

def auth_required_api(required_role=None):
    def decorator(f):
        def wrapper(*args, **kwargs):
            user = authenticate_user_from_request()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if required_role and user.role != required_role:
                return jsonify({'error': 'Admin access required'}), 403
            
            request.user = user
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

@processing_bp.route('/auto-process', methods=['POST'])
@auth_required_api(required_role='admin')
def auto_process_documents():
    try:
        user = request.user
        
        data = request.get_json() or {}
        department = data.get('department')
        
        result = auto_fetch_and_process(department)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        if 'documents' in result:
            for doc_data in result['documents']:
                existing = ProcessedDocument.query.filter_by(
                    original_filename=doc_data['original_filename']
                ).first()
                
                if not existing:
                    processed_doc = ProcessedDocument(
                        original_filename=doc_data['original_filename'],
                        processed_filename=f"processed_{doc_data['original_filename']}",
                        file_path=doc_data.get('s3_url', ''),
                        document_type=doc_data['document_type'],
                        department=doc_data['department'],
                        summary='',
                        key_points=json.dumps([]),
                        action_items=json.dumps([]),
                        priority=doc_data['priority'],
                        processed_by=user.id,
                        status='pending_processing'
                    )
                    
                    db.session.add(processed_doc)
        
        db.session.commit()
        
        return jsonify({
            'message': result.get('message', 'Processing completed'),
            'total_processed': result.get('total_processed', 0),
            'by_department': result.get('by_department', {}),
            'documents': result.get('documents', [])
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/process-s3-document', methods=['POST'])
@auth_required_api(required_role='admin')
def process_s3_document_api():
    try:
        user = request.user
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        s3_key = data.get('s3_key')
        if not s3_key:
            return jsonify({'error': 'S3 key required'}), 400
        
        # Process the document
        result = process_s3_document(s3_key)
        
        # Save to database
        processed_doc = ProcessedDocument(
            original_filename=result.original_filename,
            processed_filename=result.processed_filename,
            file_path=result.s3_url,
            document_type=result.document_type.value,
            department=result.department.value,
            summary=result.summary,
            key_points=json.dumps(result.key_points),
            action_items=json.dumps(result.action_items),
            deadline=result.deadline,
            priority=result.priority,
            doc_metadata=json.dumps(result.metadata),
            processed_by=user.id,
            status='processed'
        )
        
        db.session.add(processed_doc)
        db.session.commit()
        
        return jsonify({
            'message': 'Document processed successfully',
            'document': {
                'id': processed_doc.id,
                'original_filename': result.original_filename,
                'department': result.department.value,
                'document_type': result.document_type.value,
                'priority': result.priority,
                'summary': result.summary[:200] + '...' if len(result.summary) > 200 else result.summary,
                's3_url': result.s3_url
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/list-s3-documents', methods=['GET'])
@auth_required_api(required_role='admin')
def list_s3_documents_api():
    try:
        user = request.user
        
        department = request.args.get('department')
        limit = request.args.get('limit', 50, type=int)
        
        # List documents from S3
        documents = list_s3_documents(department, limit)
        
        return jsonify({
            'documents': documents,
            'total': len(documents)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/department-documents/<department>', methods=['GET'])
@auth_required_api()
def get_department_documents(department):
    try:
        user = request.user
        
        # Check if user has access to this department
        if user.role != 'admin' and user.department != department:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get processed documents from database for this department
        db_documents = ProcessedDocument.query.filter_by(
            department=department,
            status='processed'
        ).order_by(ProcessedDocument.processed_date.desc()).all()
        
        # Convert database documents to response format
        all_documents = []
        
        for doc in db_documents:
            # Parse JSON fields if they exist
            key_points = []
            action_items = []
            
            if doc.key_points:
                try:
                    key_points = json.loads(doc.key_points)
                except:
                    key_points = []
            
            if doc.action_items:
                try:
                    action_items = json.loads(doc.action_items)
                except:
                    action_items = []
            
            # Build document object
            # Parse doc_metadata JSON string if present
            metadata_dict = {}
            if doc.doc_metadata:
                try:
                    metadata_dict = json.loads(doc.doc_metadata)
                except Exception:
                    metadata_dict = {}

            doc_obj = {
                'id': doc.id,
                'original_filename': doc.original_filename,
                'document_type': doc.document_type,
                'department': doc.department,
                'summary': doc.summary or '',
                'key_points': key_points,
                'action_items': action_items,
                'deadline': doc.deadline if doc.deadline else None,
                'priority': doc.priority or 'medium',
                'processed_date': doc.processed_date.isoformat() if doc.processed_date else None,
                'file_path': doc.file_path,
                'file_size': metadata_dict.get('file_size', 'Unknown'),
                'uploaded_by': User.query.get(doc.processed_by).username if doc.processed_by else 'System',
                'status': doc.status,
                'source': 'database',
                's3_url': doc.file_path if doc.file_path and doc.file_path.startswith('http') else None,
                'metadata': metadata_dict
            }
            all_documents.append(doc_obj)
        
        # Also fetch unprocessed S3 documents for this department
        s3_docs = list_s3_documents(department)
        
        # Add S3 documents that aren't in database yet
        s3_filenames = [d['original_filename'] for d in all_documents]
        for s3_doc in s3_docs:
            filename = os.path.basename(s3_doc['key'])
            if filename not in s3_filenames:
                # Extract department from S3 key path
                dept_from_key = s3_doc.get('department', department)
                
                all_documents.append({
                    'id': None,  # No database ID yet
                    'original_filename': filename,
                    'document_type': s3_doc.get('document_type', 'unknown'),
                    'department': dept_from_key,
                    'summary': 'Document is in S3 but not yet fully processed. Please run processing.',
                    'key_points': [],
                    'action_items': [],
                    'priority': 'medium',
                    'processed_date': s3_doc.get('last_modified'),
                    'status': 'pending_processing',
                    'source': 's3',
                    's3_url': s3_doc.get('url'),
                    's3_key': s3_doc.get('key'),
                    'file_size': f"{s3_doc.get('size', 0) / 1024 / 1024:.2f} MB",
                    'uploaded_by': 'System (S3)'
                })
        
        return jsonify(all_documents)
        
    except Exception as e:
        print(f"Error in get_department_documents: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/document/<int:doc_id>', methods=['GET'])
@auth_required_api()
def get_document_details(doc_id):
    try:
        user = request.user
        
        document = ProcessedDocument.query.get_or_404(doc_id)
        
        # Check permissions
        if user.role != 'admin' and user.department != document.department:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'id': document.id,
            'original_filename': document.original_filename,
            'processed_filename': document.processed_filename,
            'document_type': document.document_type,
            'department': document.department,
            'summary': document.summary,
            'key_points': json.loads(document.key_points) if document.key_points else [],
            'action_items': json.loads(document.action_items) if document.action_items else [],
            'deadline': document.deadline,
            'priority': document.priority,
            'metadata': json.loads(document.doc_metadata) if document.doc_metadata else {},
            'processed_date': document.processed_date.isoformat() if document.processed_date else None,
            'file_path': document.file_path,
            'status': document.status
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/documents/summary', methods=['GET'])
@auth_required_api(required_role='admin')
def get_documents_summary():
    try:
        user = request.user
        
        # Get database documents
        db_documents = ProcessedDocument.query.all()
        
        # Get S3 documents
        s3_documents = list_s3_documents()
        
        # Calculate statistics
        total_documents = len(db_documents) + len(s3_documents)
        
        # Department distribution from database
        departments_db = {}
        for doc in db_documents:
            if doc.department not in departments_db:
                departments_db[doc.department] = 0
            departments_db[doc.department] += 1
        
        # Department distribution from S3
        departments_s3 = {}
        for doc in s3_documents:
            dept = doc.get('department', 'unknown')
            if dept not in departments_s3:
                departments_s3[dept] = 0
            departments_s3[dept] += 1
        
        # Combine departments
        all_departments = set(list(departments_db.keys()) + list(departments_s3.keys()))
        department_distribution = {
            dept: departments_db.get(dept, 0) + departments_s3.get(dept, 0)
            for dept in all_departments
        }
        
        # Recent activity
        recent_docs = ProcessedDocument.query.order_by(
            ProcessedDocument.processed_date.desc()
        ).limit(10).all()
        
        recent_activity = []
        for doc in recent_docs:
            uploader = User.query.get(doc.processed_by)
            recent_activity.append({
                'id': doc.id,
                'action': f'Processed {doc.original_filename}',
                'user': uploader.username if uploader else 'System',
                'time': doc.processed_date.isoformat() if doc.processed_date else None,
                'department': doc.department
            })
        
        return jsonify({
            'total_documents': total_documents,
            'database_documents': len(db_documents),
            's3_documents': len(s3_documents),
            'departments': list(all_departments),
            'by_department': department_distribution,
            'recent_activity': recent_activity
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/trigger-processing', methods=['POST'])
@auth_required_api(required_role='admin')
def trigger_processing():
    try:
        user = request.user
        
        data = request.get_json() or {}
        department = data.get('department')
        
        result = auto_fetch_and_process(department)
        
        return jsonify({
            'message': 'Processing triggered',
            'result': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/download-document/<int:doc_id>', methods=['GET'])
@auth_required_api()
def download_document(doc_id):
    try:
        user = request.user
        
        document = ProcessedDocument.query.get_or_404(doc_id)
        
        # Check permissions
        if user.role != 'admin' and user.department != document.department:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if file is in S3
        if document.file_path and document.file_path.startswith('http'):
            # File is in S3, return the URL
            return jsonify({
                'download_url': document.file_path,
                'filename': document.original_filename
            })
        elif os.path.exists(document.file_path):
            # File is local, return file path
            from flask import send_file
            return send_file(document.file_path, as_attachment=True, download_name=document.original_filename)
        else:
            return jsonify({'error': 'File not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/get-s3-url/<s3_key>', methods=['GET'])
@auth_required_api()
def get_s3_url(s3_key):
    try:
        user = request.user
        
        from model import s3_client, AWS_S3_BUCKET, AWS_REGION
        
        # Generate presigned URL (expires in 1 hour)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_S3_BUCKET,
                'Key': s3_key
            },
            ExpiresIn=3600
        )
        
        return jsonify({
            'presigned_url': presigned_url,
            'filename': os.path.basename(s3_key)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@processing_bp.route('/test-connection', methods=['GET'])
def test_connection():
    return jsonify({
        'status': 'ok',
        'service': 'InfraDoc Processing API',
        'timestamp': datetime.now().isoformat()
    })