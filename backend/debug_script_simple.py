
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crosscert.settings')
django.setup()

from events.models import Certificate, EventRegistration

email = 'catherine.arnado@hcdc.edu.ph'
print(f"DEBUG: Checking for {email}")

reg_count = EventRegistration.objects.filter(email__iexact=email).count()
cert_count = Certificate.objects.filter(registration__email__iexact=email).count()
total_certs = Certificate.objects.count()

print(f"DEBUG: Registrations found: {reg_count}")
print(f"DEBUG: Certificates for user: {cert_count}")
print(f"DEBUG: Total Certificates in DB: {total_certs}")

if reg_count > 0:
    reg = EventRegistration.objects.filter(email__iexact=email).first()
    print(f"DEBUG: First Reg ID: {reg.id}, Event: {reg.event.title}, Has Cert: {hasattr(reg, 'certificate')}")
