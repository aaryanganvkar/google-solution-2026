# reset_db.py
from app import create_app
from models import db, User

app = create_app()

with app.app_context():
    # Drop all tables
    db.drop_all()
    print("✅ Dropped all tables")
    
    # Create tables with new schema
    db.create_all()
    print("✅ Created tables with new schema")
    
    # Create admin user
    admin = User(
        username='admin',
        email='admin@infradoc.com',
        role='admin',
        department='admin'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    print("✅ Created admin user: admin / admin123")
    
    # Create test users for each department
    departments = ['engineering', 'operations', 'procurement', 'hr', 'safety', 'compliance']
    
    for dept in departments:
        user = User(
            username=dept,
            email=f'{dept}@infradoc.com',
            role='user',
            department=dept
        )
        user.set_password(f'{dept.capitalize()}123')
        db.session.add(user)
        print(f"✅ Created {dept} user: {dept} / {dept.capitalize()}123")
    
    db.session.commit()
    print("✅ Database reset successfully!")