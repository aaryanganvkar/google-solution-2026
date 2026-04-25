# create_users.py
from app import app, db
from models import User
from werkzeug.security import generate_password_hash

def create_default_users():
    with app.app_context():
        # Clear existing users (optional)
        # User.query.delete()
        
        # Create admin user
        admin = User(
            username='admin',
            email='admin@infradoc.com',
            department='admin',
            role='admin',
            is_active=True
        )
        admin.set_password('admin123')
        
        # Create department users
        users_data = [
            {'username': 'engineer1', 'email': 'engineer@infradoc.com', 'department': 'engineering', 'password': 'engineer123'},
            {'username': 'operations1', 'email': 'operations@infradoc.com', 'department': 'operations', 'password': 'operations123'},
            {'username': 'safety1', 'email': 'safety@infradoc.com', 'department': 'safety', 'password': 'safety123'},
            {'username': 'procurement1', 'email': 'procurement@infradoc.com', 'department': 'procurement', 'password': 'procurement123'},
            {'username': 'hr1', 'email': 'hr@infradoc.com', 'department': 'hr', 'password': 'hr123'},
        ]
        
        users = [admin]
        for user_data in users_data:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                department=user_data['department'],
                role='user',
                is_active=True
            )
            user.set_password(user_data['password'])
            users.append(user)
        
        # Add to database
        for user in users:
            existing = User.query.filter_by(username=user.username).first()
            if not existing:
                db.session.add(user)
                print(f"Created user: {user.username}")
            else:
                print(f"User already exists: {user.username}")
        
        db.session.commit()
        print("✅ Default users created successfully!")

if __name__ == '__main__':
    create_default_users()