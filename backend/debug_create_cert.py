
import os
import django
import sys
import datetime

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crosscert.settings')
django.setup()

from events.models import Certificate, EventRegistration
from certificates.generator import CertificateService

email = 'catherine.arnado@hcdc.edu.ph'
print(f"DEBUG: Attempting to generate cert for {email}")

reg = EventRegistration.objects.filter(email__iexact=email).first()

if not reg:
    print("ERROR: Registration not found!")
    sys.exit(1)

print(f"Found Registration: {reg.id} (Event: {reg.event.title})")

if hasattr(reg, 'certificate'):
    print("Certificate ALREADY EXISTS via 'certificate' relation!")
    print(f"ID: {reg.certificate.id}")
else:
    print("No certificate found via 'certificate' relation.")

# Attempt generation
try:
    print("Generating certificate...")
    # Mocking what the view does
    # We'll just create a dummy one for testing DB persistence first, 
    # OR use the service if available.
    
    cert_number = f"DEBUG-{reg.id}-{datetime.datetime.now().timestamp()}"
    
    # Check if we can import CertificateService
    try:
        from certificates.generator import CertificateService
        service = CertificateService()
        # pdf_path = service.generate_for_participant(reg, reg.event) 
        # But view uses generate_for_participant returning base64?
        # View code: pdf_base64 = service.generate_for_participant(..., save_to_disk=False)
        pass
    except Exception as e:
        print(f"Service error: {e}")

    # Manual create
    cert = Certificate.objects.create(
        registration=reg,
        certificate_number=cert_number,
        status="generated",
        issue_date=datetime.date.today()
    )
    print(f"SUCCESS: Created Certificate ID {cert.id}")
    
    # Verify persistence
    count = Certificate.objects.filter(id=cert.id).count()
    print(f"Verification: Found {count} object(s) with ID {cert.id}")

except Exception as e:
    print(f"FAILED to create certificate: {e}")
    import traceback
    traceback.print_exc()
