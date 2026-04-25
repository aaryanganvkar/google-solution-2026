"""
seed_documents.py
-----------------
Seeds the database with sample documents from the sample_docs/ folder
so the app shows real data without needing S3 or the LLM to be online.

Run from the backend directory:
    python seed_documents.py
"""
import os, sys, json
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, User, Document, ProcessedDocument

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), 'sample_docs')

# Mapping: filename prefix → (department, doc_type, priority)
DOC_META = {
    'engineering_inspection_report.txt': ('engineering', 'engineering_report',    'high'),
    'safety_incident_report.txt':        ('safety',      'safety_report',         'high'),
    'purchase_order_valves.txt':         ('procurement', 'procurement_order',     'medium'),
    'hr_onboarding_priya_sharma.txt':    ('hr',          'hr_document',           'low'),
    'compliance_audit_Q1_2024.txt':      ('compliance',  'compliance_document',   'high'),
    'operations_sop_shift_handover.txt': ('operations',  'operations_manual',     'medium'),
}

SUMMARIES = {
    'engineering_inspection_report.txt': (
        'Q1 2024 structural inspection of Facility Block C. Overall condition is satisfactory. '
        'Roof membrane blistering, degraded fireproofing on HVAC penetrations, and a corroded '
        'handrail require urgent attention before May 2024.',
        ['Roof membrane blistering on south-facing section (~12 sq m)',
         'Fireproofing degraded around 3 HVAC duct penetrations',
         'Corrosion on Level 2 stairwell handrail',
         'Blocked downspout causing minor pooling',
         'All load-bearing columns passed inspection'],
        ['Engage roof repair contractor by May 15, 2024',
         'Replace corroded handrail by May 10, 2024',
         'Restore HVAC fireproofing by April 30, 2024',
         'Clear blocked downspout by May 1, 2024'],
        'May 15, 2024',
    ),
    'safety_incident_report.txt': (
        'Minor laceration incident on April 10, 2024 due to failure to wear cut-resistant gloves '
        'during valve replacement. Root cause: inadequate PPE compliance and pre-task briefing. '
        'Corrective actions and refresher training are mandatory.',
        ['Technician EMP-0342 sustained right hand laceration',
         'PPE (cut-resistant gloves) not worn at time of incident',
         'First aid administered on-site – no lost-time injury',
         'Contributing factor: inadequate pre-task briefing'],
        ['Complete PPE refresher training for all maintenance supervisors by April 25, 2024',
         'Review and update PPE compliance checklist by April 20, 2024',
         'Install PPE reminder signage at pump stations by April 30, 2024',
         'Submit corrective action closure report to HSE Manager by May 1, 2024'],
        'April 25, 2024',
    ),
    'purchase_order_valves.txt': (
        'Purchase Order PO-2024-5512 issued to Apex Industrial Supplies for high-pressure gate '
        'valves, PTFE gaskets, flange bolts, and pipe insulation. Grand total ₹4,11,820 including '
        'GST. Delivery required by May 5, 2024.',
        ['12 × 6-inch PN40 gate valves – ₹2,22,000',
         '50 × PTFE gasket sheets – ₹42,500',
         '500 × M20 flange bolts – ₹22,500',
         '100 × insulation wrap rolls – ₹62,000',
         'Grand total with 18% GST: ₹4,11,820'],
        ['Deliver all items by May 5, 2024',
         'Vendor to provide material test certificates for gate valves',
         'Submit invoice within 7 days of delivery'],
        'May 5, 2024',
    ),
    'hr_onboarding_priya_sharma.txt': (
        'Onboarding document for Priya Sharma (EMP-2024-0187), Operations Analyst joining April 15, '
        '2024. Mandatory safety induction and cybersecurity training pending. Health insurance and '
        'PF nominations must be submitted by April 25, 2024.',
        ['Safety induction must be completed by April 19, 2024',
         'Health insurance nomination pending – due April 25, 2024',
         'Cybersecurity training due April 30, 2024',
         'Probation period: 6 months (ends October 14, 2024)'],
        ['Submit health insurance nomination by April 25, 2024',
         'Submit PF nomination by April 25, 2024',
         'Complete safety induction by April 19, 2024',
         'Complete cybersecurity training by April 30, 2024'],
        'April 25, 2024',
    ),
    'compliance_audit_Q1_2024.txt': (
        'Q1 2024 internal ISO 9001:2015 audit of Operations and Engineering divisions resulted in a '
        'Conditional Pass. Two non-conformances raised: unsigned controlled documents and overdue '
        'gauge calibrations. Both must be closed by May 15, 2024.',
        ['NC-01: 14 controlled documents missing current revision signatures',
         'NC-02: 3 pressure gauges overdue for calibration since Sep 2023',
         'Corrective action closure rate improved from 68% to 89%',
         'Customer complaint resolution reduced to 4.2 days average'],
        ['Close NC-01 (document control) by May 15, 2024',
         'Close NC-02 (gauge calibration) by April 30, 2024',
         'Schedule management review meeting by May 20, 2024',
         'Update supplier evaluation procedure by June 1, 2024'],
        'May 15, 2024',
    ),
    'operations_sop_shift_handover.txt': (
        'SOP OPS-SOP-014 v3.1 defines the mandatory daily shift handover procedure for all rotating '
        'operations staff. Requires minimum 15-minute handover meeting, logbook sign-off, and a '
        'physical equipment walkdown by the incoming shift within the first 30 minutes.',
        ['Outgoing shift must update log 30 minutes before shift end',
         'Minimum 15-minute verbal handover meeting is mandatory',
         'Incoming shift lead must sign handover logbook',
         'Physical walkdown of key equipment within first 30 minutes',
         'Shift handover logs retained for 2 years'],
        ['Ensure all shift leads are trained on SOP-014 by April 30, 2024',
         'Operations Manager to review handover logs monthly'],
        None,
    ),
}

def seed():
    app = create_app()
    with app.app_context():
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("❌  Admin user not found. Run reset.py first.")
            return

        for filename, (dept, doc_type, priority) in DOC_META.items():
            filepath = os.path.join(SAMPLE_DIR, filename)
            if not os.path.exists(filepath):
                print(f"⚠️  File not found: {filename}, skipping.")
                continue

            # Skip if already seeded
            existing = ProcessedDocument.query.filter_by(original_filename=filename).first()
            if existing:
                print(f"ℹ️  Already exists: {filename}")
                continue

            summary, key_points, action_items, deadline = SUMMARIES[filename]
            file_size = os.path.getsize(filepath)

            # Also create a Document entry (for the Document Library view)
            doc = Document(
                title=filename.replace('_', ' ').replace('.txt', '').title(),
                description=summary,
                filename=filename,
                file_path=filepath,
                file_size=file_size,
                file_type='txt',
                department=dept,
                category=doc_type.replace('_', ' ').title(),
                tags=f"{dept},{doc_type},{priority}",
                uploaded_by=admin.id,
                status='active',
            )
            db.session.add(doc)

            # Create a ProcessedDocument entry (for DepartmentDashboard view)
            pdoc = ProcessedDocument(
                original_filename=filename,
                processed_filename=f"processed_{filename}",
                file_path=filepath,
                document_type=doc_type,
                department=dept,
                summary=summary,
                key_points=json.dumps(key_points),
                action_items=json.dumps(action_items),
                deadline=deadline,
                priority=priority,
                doc_metadata=json.dumps({'file_size': f"{file_size/1024:.1f} KB", 'source': 'seed'}),
                processed_by=admin.id,
                status='processed',
            )
            db.session.add(pdoc)
            print(f"✅  Seeded: {filename}  →  {dept} / {doc_type}")

        db.session.commit()
        print("\n🎉 Sample documents seeded successfully!")
        print(f"   Total ProcessedDocuments: {ProcessedDocument.query.count()}")
        print(f"   Total Documents:          {Document.query.count()}")

if __name__ == '__main__':
    seed()
