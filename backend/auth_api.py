# auth_api.py
from flask import Blueprint, request, jsonify
from models import db, User, Document, ProcessedDocument
import os
from werkzeug.utils import secure_filename
import uuid
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv
import jwt
import datetime

load_dotenv()

auth_bp = Blueprint('auth', __name__)
doc_bp = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'png', 'jpeg'}
UPLOAD_FOLDER = 'uploads'

# DEFINE DEPARTMENTS CONSTANT HERE
DEPARTMENTS = ['engineering', 'operations', 'procurement', 'hr', 'safety', 'compliance', 'admin']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# AWS S3 Configuration
AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=AWS_REGION
    )

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'infradoc-ai-secret-jwt-key-2024')

def generate_token(user_id, username, role, department):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'department': department,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def authenticate_user(username, password, required_role=None):
    """Authenticate user and check optional role requirement"""
    user = User.query.filter_by(username=username).first()
    
    if not user:
        print(f"❌ User not found: {username}")
        return None
    
    if not user.check_password(password):
        print(f"❌ Password incorrect for user: {username}")
        return None
    
    if not user.is_active:
        print(f"❌ User inactive: {username}")
        return None
    
    if required_role and user.role != required_role:
        print(f"❌ Role mismatch. Required: {required_role}, User has: {user.role}")
        return None
    
    return user

def get_user_from_request():
    """Extract user credentials from request - supports multiple methods"""
    
    # Method 1: Try JWT token in Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if payload:
            user = User.query.get(payload['user_id'])
            if user:
                return user.username, None  # Return username, no password needed
    
    # Method 2: Try JSON body
    data = request.get_json(silent=True)
    if data:
        username = data.get('username')
        password = data.get('password')
        if username and password:
            print(f"📝 Got credentials from JSON: {username}")
            return username, password
    
    # Method 3: Try form data
    username = request.form.get('username')
    password = request.form.get('password')
    if username and password:
        print(f"📝 Got credentials from form: {username}")
        return username, password
    
    # Method 4: Try query parameters
    username = request.args.get('username')
    password = request.args.get('password')
    if username and password:
        print(f"📝 Got credentials from query: {username}")
        return username, password
    
    print("❌ No credentials found in request")
    return None, None

def auth_required(required_role=None):
    """Decorator for authentication"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            print(f"🔐 Auth required for endpoint: {request.path}")
            username, password = get_user_from_request()
            
            if not username:
                print("❌ Missing username")
                return jsonify({'error': 'Authentication required'}), 401
            
            # If we have a JWT token (password is None), we need to get the user differently
            if password is None:
                # Get user from database
                user = User.query.filter_by(username=username).first()
                if not user:
                    print(f"❌ User not found: {username}")
                    return jsonify({'error': 'Invalid credentials'}), 401
            else:
                # Use password authentication
                user = authenticate_user(username, password, required_role)
                if not user:
                    print(f"❌ Authentication failed for user: {username}")
                    return jsonify({'error': 'Invalid credentials or insufficient permissions'}), 401
            
            print(f"✅ User authenticated: {username}")
            # Attach user to request context
            request.user = user
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if username exists
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Check if email exists
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email already exists'}), 400
        
        department = data.get('department', '').lower()
        if department not in DEPARTMENTS:
            return jsonify({'error': 'Invalid department'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            department=department,
            role='user' if department != 'admin' else 'admin'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Update last login
        user.last_login = datetime.datetime.utcnow()
        db.session.commit()
        
        # Generate JWT token
        token = generate_token(user.id, user.username, user.role, user.department)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_required()
def logout():
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/me', methods=['GET'])
@auth_required()
def get_current_user_info():
    try:
        user = request.user
        return jsonify(user.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/departments', methods=['GET'])
def get_departments():
    return jsonify(DEPARTMENTS)

@auth_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(Document.category).distinct().filter(Document.category.isnot(None)).all()
    return jsonify([cat[0] for cat in categories])

@doc_bp.route('/upload', methods=['POST'])
@auth_required()
def upload_document():
    try:
        user = request.user
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        department = request.form.get('department', user.department)
        category = request.form.get('category', '')
        tags = request.form.get('tags', '')
        
        if department not in DEPARTMENTS:
            return jsonify({'error': 'Invalid department'}), 400
        
        # Ensure upload directory exists
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)
        
        document = Document(
            title=title or filename,
            description=description,
            filename=filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            file_type=filename.rsplit('.', 1)[1].lower(),
            department=department,
            category=category,
            tags=tags,
            uploaded_by=user.id
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/upload-s3', methods=['POST'])
def upload_document_s3():
    try:
        print("📤 Starting upload...")

        # ── Auth: prefer JWT Bearer, fall back to form credentials ──────────
        user = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                user = User.query.get(payload['user_id'])

        if not user:
            username = request.form.get('username')
            password = request.form.get('password')
            if username and password:
                user = authenticate_user(username, password)

        if not user:
            print("❌ Authentication failed")
            return jsonify({'error': 'Authentication required'}), 401

        print(f"✅ User authenticated: {user.username}")

        # ── File validation ──────────────────────────────────────────────────
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # ── Metadata from form ───────────────────────────────────────────────
        title       = request.form.get('title', '')
        description = request.form.get('description', '')
        department  = request.form.get('department', user.department or 'admin')
        category    = request.form.get('category', '')
        tags        = request.form.get('tags', '')

        if department not in DEPARTMENTS:
            department = user.department if user.department in DEPARTMENTS else 'admin'

        filename = secure_filename(file.filename)
        file_content = file.read()
        file_size    = len(file_content)
        file.seek(0)

        # ── Store file in Database ───────────────────────────────────────────
        file_path = None
        s3_url = None
        s3_key = None
        local_path = None

        # ── Run LLM processing pipeline ──────────────────────────────────────
        processed_doc = None
        try:
            from model import (
                extract_text_from_file, classify_document, determine_department,
                create_summary, extract_key_points, extract_action_items,
                extract_deadline, determine_priority
            )
            import json as _json

            import tempfile
            tmp = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=os.path.splitext(filename)[1]
            )
            tmp.write(file_content)
            tmp.close()
            source_path = tmp.name

            raw_text    = extract_text_from_file(source_path)
            doc_type    = classify_document(raw_text)
            # Use LLM-determined dept only if no dept was set by admin in form
            if not request.form.get('department'):
                dept_enum = determine_department(doc_type, raw_text)
                department = dept_enum.value
            summary      = create_summary(raw_text, doc_type)
            key_points   = extract_key_points(raw_text)
            action_items = extract_action_items(raw_text)
            deadline     = extract_deadline(raw_text)
            priority     = determine_priority(raw_text)

            os.unlink(source_path)

            processed_doc = ProcessedDocument(
                original_filename=filename,
                processed_filename=f"processed_{filename}",
                file_path=None,
                file_data=file_content,
                document_type=doc_type.value,
                department=department,
                summary=summary,
                key_points=_json.dumps(key_points),
                action_items=_json.dumps(action_items),
                deadline=deadline,
                priority=priority,
                doc_metadata=_json.dumps({
                    'file_size': f"{file_size/1024:.1f} KB",
                    'uploaded_by': user.username,
                }),
                processed_by=user.id,
                status='processed',
            )
            db.session.add(processed_doc)
            print(f"✅ LLM processing complete: {doc_type.value} → {department}")

        except Exception as proc_err:
            print(f"⚠️  LLM processing failed ({proc_err}); document saved without AI analysis")
            processed_doc = None

        # ── Save Document record ─────────────────────────────────────────────
        if not category and processed_doc:
            category = processed_doc.document_type.replace('_', ' ').title()

        document = Document(
            title=title or filename.rsplit('.', 1)[0].replace('_', ' ').title(),
            description=description or (processed_doc.summary[:300] if processed_doc else ''),
            filename=filename,
            file_path=None,
            file_data=file_content,
            file_size=file_size,
            file_type=filename.rsplit('.', 1)[1].lower() if '.' in filename else 'unknown',
            department=department,
            category=category,
            tags=tags or (department + ',' + (processed_doc.document_type if processed_doc else '')),
            uploaded_by=user.id,
            status='active',
        )
        db.session.add(document)
        db.session.commit()
        print(f"✅ Document saved to DB: ID {document.id}")

        return jsonify({
            'message': 'File uploaded and processed successfully',
            'document': document.to_dict(),
            'processing': {
                'department': department,
                'type': processed_doc.document_type if processed_doc else 'unknown',
                'priority': processed_doc.priority if processed_doc else 'medium',
                'summary': processed_doc.summary[:200] if processed_doc else '',
            },
            'storage': 'database',
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Unexpected error in upload-s3: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@doc_bp.route('/documents', methods=['GET'])
@auth_required()
def get_documents():
    try:
        user = request.user
        
        department = request.args.get('department')
        category = request.args.get('category')
        search = request.args.get('search')
        
        query = Document.query
        
        if user.role != 'admin' and user.department != 'admin':
            query = query.filter_by(department=user.department)
        elif department and department in DEPARTMENTS:
            query = query.filter_by(department=department)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                (Document.title.contains(search)) |
                (Document.description.contains(search)) |
                (Document.tags.contains(search))
            )
        
        documents = query.order_by(Document.created_at.desc()).all()
        
        return jsonify([doc.to_dict() for doc in documents])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/documents/<int:doc_id>', methods=['GET'])
@auth_required()
def get_document(doc_id):
    try:
        user = request.user
        
        document = Document.query.get_or_404(doc_id)
        
        # Check permissions
        if user.role != 'admin' and user.department != document.department:
            return jsonify({'error': 'Access denied'}), 403
        
        # Increment view count
        document.views += 1
        db.session.commit()
        
        return jsonify(document.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/documents/<int:doc_id>/download', methods=['GET'])
@auth_required()
def download_document(doc_id):
    try:
        user = request.user
        
        document = Document.query.get_or_404(doc_id)
        
        # Check permissions
        if user.role != 'admin' and user.department != document.department:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if file is stored as BLOB
        if document.file_data:
            from flask import send_file
            import io
            document.downloads += 1
            db.session.commit()
            return send_file(
                io.BytesIO(document.file_data),
                as_attachment=True,
                download_name=document.filename
            )
        elif document.file_path and document.file_path.startswith('https://'):
            # File is in S3 - generate presigned URL
            s3_key = document.file_path.split(f'https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/')[-1]
            s3_client = get_s3_client()
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': AWS_S3_BUCKET,
                    'Key': s3_key
                },
                ExpiresIn=3600  # URL expires in 1 hour
            )
            
            # Increment download count
            document.downloads += 1
            db.session.commit()
            
            return jsonify({
                'download_url': presigned_url,
                'filename': document.filename
            })
        elif document.file_path:
            # Fallback for old local files
            from flask import send_file
            document.downloads += 1
            db.session.commit()
            return send_file(document.file_path, as_attachment=True, download_name=document.filename)
        else:
            return jsonify({'error': 'File data not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
@auth_required()
def delete_document(doc_id):
    try:
        user = request.user
        if user.role != 'admin':
            return jsonify({'error': 'Admin privileges required to delete documents'}), 403
            
        document = Document.query.get_or_404(doc_id)
        file_path = document.file_path
        filename = document.filename
        
        # 1. Delete associated ProcessedDocument if exists
        processed_doc = ProcessedDocument.query.filter(
            (ProcessedDocument.file_path == file_path) |
            (ProcessedDocument.original_filename == filename)
        ).first()
        
        if processed_doc:
            db.session.delete(processed_doc)
            
        # 2. Try to delete actual file (if stored locally previously)
        if file_path and not file_path.startswith('https://'):
            try:
                import os
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Failed to delete local file: {e}")
        elif file_path and file_path.startswith('https://'):
            # S3
            try:
                s3_key = file_path.split(f'https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/')[-1]
                s3_client = get_s3_client()
                if s3_client:
                    s3_client.delete_object(Bucket=AWS_S3_BUCKET, Key=s3_key)
            except Exception as e:
                print(f"Failed to delete from S3: {e}")

        # 3. Delete from DB
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'message': 'Document deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/documents/<int:doc_id>/presigned-url', methods=['GET'])
@auth_required()
def get_presigned_url(doc_id):
    try:
        user = request.user
        
        document = Document.query.get_or_404(doc_id)
        
        # Check permissions
        if user.role != 'admin' and user.department != document.department:
            return jsonify({'error': 'Access denied'}), 403
        
        # Return local download URL since we removed S3
        return jsonify({
            'presigned_url': f'/api/documents/{doc_id}/download',
            'filename': document.filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@auth_required(required_role='admin')
def get_users():
    try:
        users = User.query.all()
        return jsonify([u.to_dict() for u in users])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@auth_required(required_role='admin')
def update_user(user_id):
    try:
        target_user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'department' in data and data['department'] in DEPARTMENTS:
            target_user.department = data['department']
        
        if 'role' in data:
            target_user.role = data['role']
        
        if 'is_active' in data:
            target_user.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': target_user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@auth_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'InfraDoc API'})