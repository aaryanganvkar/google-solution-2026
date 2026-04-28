from models import db
import os

def init_database(app):
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # Use DATABASE_URL environment variable if provided (for Cloud SQL)
    # Otherwise fallback to local SQLite database
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        db_url = f'sqlite:///{os.path.join(basedir, "documents.db")}'
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        from models import User
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@company.com',
                department='admin',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()