from flask import Flask
from flask_cors import CORS
from models import db
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS - Allow all origins for simplicity
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # App configuration
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'infradoc-ai-secret-key-2024'),
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///infradoc.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        
        # File upload settings
        MAX_CONTENT_LENGTH=100 * 1024 * 1024,  # 100MB max file size
        UPLOAD_FOLDER='uploads',
    )
    
    # Initialize extensions
    db.init_app(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Import and register blueprints
    from auth_api import auth_bp, doc_bp
    from processing_api import processing_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(doc_bp, url_prefix='/api')
    app.register_blueprint(processing_bp, url_prefix='/api/processing')
    
    # Test routes
    @app.route('/')
    def home():
        return {'status': 'InfraDoc AI Backend Running', 'version': '1.0.0'}
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'service': 'InfraDoc AI API'}
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')